// server/index.js
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
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(sa) })
    }
    adminInited = true
    console.log('Firebase admin initialized')
  } else {
    console.log('FIREBASE_SERVICE_ACCOUNT not set → running in dev mode')
  }
} catch (err) {
  console.error('Failed to init firebase admin:', err)
  adminInited = false
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

// helper: safe timestamp -> millis
function tsToMillis(ts) {
  if (!ts) return 0
  if (typeof ts === 'number') return ts
  if (ts.toMillis) return ts.toMillis()
  // maybe Date string/object
  const d = new Date(ts)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

// verify middleware
async function verify(req, res, next) {
  const header = req.headers.authorization || ''
  // dev fallback: no firebase admin configured
  if (!adminInited) {
    req.user = { uid: 'dev-user', email: 'dev@local' }
    return next()
  }
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
  const idToken = header.split(' ')[1]
  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = decoded
    next()
  } catch (err) {
    console.error('Token verify error', err)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/* --- Classes --- */
function genCode(len=6){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s=''
  for(let i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)]
  return s
}

/* GET /api/classes
   Return classes current user is member of.
   Implementation avoids compound query that requires composite index.
*/
app.get('/api/classes', verify, async (req, res) => {
  try {
    const uid = req.user.uid

    if (!adminInited) {
      // demo response for dev mode
      return res.json([
        { id: 'demo-1', name: 'Demo Class', code: 'DEMO01', teacherIds: ['dev-user'], members: ['dev-user'], createdAt: new Date().toISOString() }
      ])
    }

    // Query by array-contains (single-field) then sort server-side to avoid composite index
    const snap = await db
      .collection('classes')
      .where('members', 'array-contains', uid)
      .get()

    const classes = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt))

    return res.json(classes)
  } catch (err) {
    console.error('GET /api/classes error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/classes
   Create class, generate a unique code
*/
app.post('/api/classes', verify, async (req,res)=> {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error:'Missing name' })

    if (!adminInited) {
      const id = 'dev-'+Date.now()
      return res.json({ ok:true, id, code:id })
    }

    // generate unique code (best-effort)
    let code = null
    for (let i=0;i<10;i++){
      const c = genCode(6)
      const q = await db.collection('classes').where('code','==',c).limit(1).get()
      if (q.empty) { code = c; break }
    }
    if (!code) code = genCode(6) // fallback

    const docRef = await db.collection('classes').add({
      name,
      code,
      teacherIds: [req.user.uid],
      members: [req.user.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return res.json({ ok:true, id: docRef.id, code })
  } catch (err) {
    console.error('POST /api/classes error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/classes/join */
app.post('/api/classes/join', verify, async (req,res)=> {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error:'Missing code' })
    if (!adminInited) return res.status(400).json({ error:'Not available in dev' })

    const snap = await db.collection('classes').where('code','==',code).limit(1).get()
    if (snap.empty) return res.status(404).json({ error:'Class not found' })
    const doc = snap.docs[0]
    await doc.ref.update({ members: admin.firestore.FieldValue.arrayUnion(req.user.uid) })
    return res.json({ ok:true, classId: doc.id })
  } catch (err) {
    console.error('POST /api/classes/join error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* GET /api/classes/:id
   Use direct doc fetch (no compound queries) then check membership server-side.
   Also fetch subcollections (assignments/files/sessions) but avoid compound queries requiring indexes.
*/
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

    // authorization: teacher/member/admin
    const uid = req.user.uid
    const userDoc = await db.collection('users').doc(uid).get().catch(()=>null)
    const role = userDoc && userDoc.exists ? (userDoc.data().role || '') : ''

    const isTeacher = Array.isArray(c.teacherIds) && c.teacherIds.includes(uid)
    const isMember = Array.isArray(c.members) && c.members.includes(uid)
    if (!(isTeacher || isMember || role === 'admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // fetch assignments and files (subcollection ordering by createdAt is single-field -> okay)
    const [assignSnap, filesSnap, sessSnap] = await Promise.all([
      cRef.collection('assignments').orderBy('createdAt','desc').get(),
      cRef.collection('files').orderBy('createdAt','desc').get(),
      // attendance sessions: avoid combining where + orderBy -> use where() then sort server-side
      db.collection('attendance_sessions').where('classId','==',id).get()
    ])

    const assignments = assignSnap.docs.map(d=>({ id:d.id, ...d.data() }))
    const files = filesSnap.docs.map(d=>({ id:d.id, ...d.data() }))
    const sessions = sessSnap.docs.map(d=>({ id:d.id, ...d.data() }))
      .sort((a,b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt))

    return res.json({
      klass: { id, ...c },
      assignments,
      files,
      sessions
    })
  } catch (err) {
    console.error('GET /api/classes/:id error:', err)
    return res.status(500).json({ error: err.message })
  }
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
    return res.json({ id: docRef.id })
  } catch (err) {
    console.error('POST /api/attendance_sessions error:', err)
    return res.status(500).json({ error: err.message })
  }
})

// record attendance (students hit this)
app.post('/api/attendance_records', verify, async (req,res)=> {
  try {
    const { sessionId, classId } = req.body
    if (!sessionId || !classId) return res.status(400).json({ error:'Missing fields' })

    if (!adminInited) {
      // dev fallback - emulate record id
      const rid = 'dev-' + Date.now()
      return res.json({ ok:true, id: rid })
    }

    const recordRef = await db.collection('attendance_records').add({
      sessionId, classId, uid: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return res.json({ ok:true, id: recordRef.id })
  } catch (err) {
    console.error('POST /api/attendance_records error:', err)
    return res.status(500).json({ error: err.message })
  }
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
    return res.json({ id: docRef.id })
  } catch (err) {
    console.error('POST /api/classes/:id/assignments error:', err)
    return res.status(500).json({ error: err.message })
  }
})

// file upload middleware
const upload = multer({ storage: multer.memoryStorage() })

app.post('/api/assignments/:assignmentId/submit', upload.single('file'), verify, async (req,res)=> {
  try {
    const assignmentId = req.params.assignmentId
    const classId = req.body.classId || req.query.classId
    if (!req.file) return res.status(400).json({ error:'Missing file' })
    if (!driveClient) return res.status(400).json({ error:'Drive not configured' })

    const parent = process.env.DRIVE_PARENT_FOLDER_ID || null
    const mimeType = req.file.mimetype || 'application/octet-stream'

    // upload buffer to Drive
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

    // store metadata in Firestore (if available)
    if (adminInited) {
      await db.collection('classes').doc(classId)
        .collection('assignments').doc(assignmentId)
        .collection('submissions').add({
          uid: req.user.uid,
          fileId,
          fileName: req.file.originalname,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    }

    return res.json({ ok:true, fileId })
  } catch (err) {
    console.error('POST /api/assignments/:assignmentId/submit error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* --- Admin: create auth user + users/{uid} doc --- */
app.post('/api/admin/users', verify, async (req,res)=> {
  try {
    const { email, role } = req.body
    if (!adminInited) return res.status(400).json({ error:'Admin functions require Firebase service account' })

    const uid = req.user.uid
    const userDoc = await db.collection('users').doc(uid).get()
    const userRole = userDoc.exists ? userDoc.data().role : null
    if (userRole !== 'admin') return res.status(403).json({ error:'Forbidden' })

    const userRecord = await auth.createUser({ email, password: 'ChangeMe123!' })
    await db.collection('users').doc(userRecord.uid).set({ email, role, createdAt: admin.firestore.FieldValue.serverTimestamp() })
    return res.json({ ok:true, uid: userRecord.uid })
  } catch (err) {
    console.error('POST /api/admin/users error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* Serve frontend build if exists */
const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req,res) => res.sendFile(path.join(distDir,'index.html')))
}

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>console.log('Server listening on', PORT))
