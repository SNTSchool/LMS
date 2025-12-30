import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { google } from 'googleapis'
import multer from 'multer'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// init firebase admin if service account provided
let adminInited = false
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    admin.initializeApp({ credential: admin.credential.cert(sa) })
    adminInited = true
    console.log('Firebase admin initialized')
  } catch (err) { console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT', err) }
}
const db = adminInited ? admin.firestore() : null
const auth = adminInited ? admin.auth() : null

// Google Drive via service account (requires DRIVE API enabled & proper permissions)
let driveClient = null
if (process.env.GOOGLE_SERVICE_ACCOUNT) {
  try {
    const gsa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
    const jwtClient = new google.auth.JWT({
      email: gsa.client_email,
      key: gsa.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject: process.env.GOOGLE_IMPERSONATE_EMAIL || undefined // optional: impersonate a user
    })
    driveClient = google.drive({ version: 'v3', auth: jwtClient })
    console.log('Google Drive client ready')
  } catch (err) { console.error('Drive init error', err) }
}

// verify middleware
async function verify(req, res, next) {
  const header = req.headers.authorization || ''
  if (!adminInited) { req.user = { uid: 'dev-user', email: 'dev@local' }; return next() }
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
  const idToken = header.split(' ')[1]
  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = decoded
    next()
  } catch (err) { return res.status(401).json({ error: 'Invalid token' }) }
}

/* --- Classes --- */
function genCode(len=6){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s=''
  for(let i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)]
  return s
}

app.get('/api/classes', verify, async (req,res)=> {
  try {
    if (!adminInited) return res.json([]) // dev
    const uid = req.user.uid
    const snap = await db.collection('classes').where('members','array-contains',uid).orderBy('createdAt','desc').get()
    res.json(snap.docs.map(d=>({ id:d.id, ...d.data() })))
  } catch (err){ res.status(500).json({ error: err.message }) }
})

app.post('/api/classes', verify, async (req,res)=> {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error:'Missing name' })
    if (!adminInited) {
      const id = 'dev-'+Date.now()
      return res.json({ ok:true, id, code:id })
    }
    let code
    for (let i=0;i<10;i++){
      code = genCode(6)
      const q = await db.collection('classes').where('code','==',code).limit(1).get()
      if (q.empty) break
      code = null
    }
    const docRef = await db.collection('classes').add({
      name,
      code,
      teacherIds: [req.user.uid],
      members: [req.user.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    res.json({ ok:true, id: docRef.id, code })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/classes/join', verify, async (req,res)=> {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error:'Missing code' })
    if (!adminInited) return res.status(400).json({ error:'Not available in dev' })
    const snap = await db.collection('classes').where('code','==',code).limit(1).get()
    if (snap.empty) return res.status(404).json({ error:'Class not found' })
    const doc = snap.docs[0]
    await doc.ref.update({ members: admin.firestore.FieldValue.arrayUnion(req.user.uid) })
    res.json({ ok:true, classId: doc.id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/classes/:id', verify, async (req,res)=> {
  try {
    const { id } = req.params
    if (!adminInited) {
      return res.json({ klass: { id, name: 'Demo Class', code: 'DEMO01' }, assignments: [], sessions: [] })
    }
    const cRef = db.collection('classes').doc(id)
    const cSnap = await cRef.get()
    if (!cSnap.exists) return res.status(404).json({ error:'Class not found' })
    const c = cSnap.data()
    const [assignSnap, filesSnap, sessSnap] = await Promise.all([
      cRef.collection('assignments').orderBy('createdAt','desc').get(),
      cRef.collection('files').orderBy('createdAt','desc').get(),
      db.collection('attendance_sessions').where('classId','==',id).orderBy('createdAt','desc').get()
    ])
    res.json({
      klass: { id, ...c },
      assignments: assignSnap.docs.map(d=>({ id:d.id, ...d.data() })),
      files: filesSnap.docs.map(d=>({ id:d.id, ...d.data() })),
      sessions: sessSnap.docs.map(d=>({ id:d.id, ...d.data() }))
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

/* --- Attendance sessions --- */
app.post('/api/attendance_sessions', verify, async (req,res)=> {
  try {
    const { classId } = req.body
    if (!classId) return res.status(400).json({ error:'Missing classId' })
    if (!adminInited) return res.status(400).json({ error:'Not available in dev' })
    const docRef = await db.collection('attendance_sessions').add({
      classId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    res.json({ id: docRef.id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// record attendance (students hit this)
app.post('/api/attendance_records', verify, async (req,res)=> {
  try {
    const { sessionId, classId } = req.body
    if (!sessionId || !classId) return res.status(400).json({ error:'Missing fields' })
    const recordRef = await (adminInited ? db.collection('attendance_records').add({
      sessionId, classId, uid: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp()
    }) : Promise.resolve({ id: 'dev-'+Date.now() }))
    res.json({ ok:true, id: recordRef.id || recordRef.id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

/* --- Assignments: create and submit (upload to Drive) --- */
app.post('/api/classes/:id/assignments', verify, async (req,res)=> {
  try {
    const { id } = req.params
    const { title, description } = req.body
    if (!title) return res.status(400).json({ error:'Missing title' })
    if (!adminInited) {
      const aid = 'dev-'+Date.now()
      return res.json({ id: aid })
    }
    const cRef = db.collection('classes').doc(id)
    const docRef = await cRef.collection('assignments').add({
      title, description, createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    res.json({ id: docRef.id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// file upload middleware
const upload = multer({ storage: multer.memoryStorage() })

app.post('/api/assignments/:assignmentId/submit', upload.single('file'), verify, async (req,res)=> {
  try {
    const assignmentId = req.params.assignmentId
    const classId = req.body.classId || req.query.classId
    if (!req.file) return res.status(400).json({ error:'Missing file' })
    if (!driveClient) return res.status(400).json({ error:'Drive not configured' })
    // upload to Drive (to parent folder if provided)
    const parent = process.env.DRIVE_PARENT_FOLDER_ID || null
    const mimeType = req.file.mimetype || 'application/octet-stream'
    const driveRes = await driveClient.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: parent ? [parent] : undefined
      },
      media: {
        mimeType,
        body: Buffer.from(req.file.buffer)
      }
    })
    const fileId = driveRes.data.id
    // store metadata in Firestore
    if (adminInited) {
      await db.collection('classes').doc(classId).collection('assignments').doc(assignmentId).collection('submissions').add({
        uid: req.user.uid,
        fileId,
        fileName: req.file.originalname,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    res.json({ ok:true, fileId })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

/* --- Admin: create auth user + users/{uid} doc --- */
app.post('/api/admin/users', verify, async (req,res)=> {
  try {
    const { email, role } = req.body
    if (!adminInited) return res.status(400).json({ error:'Admin functions require Firebase service account' })
    // only allow admin users to create accounts
    const uid = req.user.uid
    const userDoc = await db.collection('users').doc(uid).get()
    const userRole = userDoc.exists ? userDoc.data().role : null
    if (userRole !== 'admin') return res.status(403).json({ error:'Forbidden' })

    const userRecord = await auth.createUser({ email, password: 'ChangeMe123!' })
    await db.collection('users').doc(userRecord.uid).set({ email, role, createdAt: admin.firestore.FieldValue.serverTimestamp() })
    res.json({ ok:true, uid: userRecord.uid })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

/* Serve frontend build if exists */
const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req,res) => res.sendFile(path.join(distDir,'index.html')))
}

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>console.log('Server listening on', PORT))
