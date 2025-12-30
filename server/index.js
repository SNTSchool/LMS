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
    console.log('FIREBASE_SERVICE_ACCOUNT not set → dev mode')
  }
} catch (err) {
  console.error('Failed to init firebase admin:', err)
  adminInited = false
}

const db = adminInited ? admin.firestore() : null
const auth = adminInited ? admin.auth() : null

// Google Drive via service account (optional)
let driveClient = null
if (process.env.GOOGLE_SERVICE_ACCOUNT) {
  try {
    const gsa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
    const jwtClient = new google.auth.JWT({
      email: gsa.client_email,
      key: gsa.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject: process.env.GOOGLE_IMPERSONATE_EMAIL || undefined
    })
    driveClient = google.drive({ version: 'v3', auth: jwtClient })
    console.log('Google Drive client ready')
  } catch (err) {
    console.error('Drive init error', err)
  }
}

const upload = multer({ storage: multer.memoryStorage() })

function tsToMillis(ts) {
  if (!ts) return 0
  if (typeof ts === 'number') return ts
  if (ts.toMillis) return ts.toMillis()
  const d = new Date(ts)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

// helper: read user role from Firestore
async function getUserRole(uid) {
  if (!adminInited) return 'admin' // dev mode: make things easier
  try {
    const udoc = await db.collection('users').doc(uid).get()
    if (!udoc.exists) return null
    return udoc.data().role || null
  } catch (err) {
    console.warn('getUserRole error', err)
    return null
  }
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
  } catch (err) {
    console.error('Token verify error', err)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/* ---------- Helpers ---------- */
function genCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

/* ---------- ROUTES ---------- */

/* GET /api/classes
   Only returns classes where user is a member (or all if admin)
   No compound query that requires composite index (sort server-side)
*/
app.get('/api/classes', verify, async (req, res) => {
  try {
    const uid = req.user.uid
    const role = await getUserRole(uid)

    if (!adminInited) {
      return res.json([{ id: 'demo-1', name: 'Demo Class', code: 'DEMO01', teacherIds: ['dev-user'], members: ['dev-user'], createdAt: new Date().toISOString() }])
    }

    let classes = []
    if (role === 'admin') {
      const snap = await db.collection('classes').get()
      classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } else {
      const snap = await db.collection('classes').where('members', 'array-contains', uid).get()
      classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }

    classes.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt))
    return res.json(classes)
  } catch (err) {
    console.error('GET /api/classes error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/classes
   Only teacher or admin can create classes
*/
app.post('/api/classes', verify, async (req, res) => {
  try {
    const uid = req.user.uid
    const role = await getUserRole(uid)
    if (!['teacher', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' })

    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })

    if (!adminInited) {
      const id = 'dev-' + Date.now()
      return res.json({ ok: true, id, code: id })
    }

    // generate unique code
    let code = null
    for (let i = 0; i < 10; i++) {
      const c = genCode(6)
      const q = await db.collection('classes').where('code', '==', c).limit(1).get()
      if (q.empty) { code = c; break }
    }
    if (!code) code = genCode(6)

    const docRef = await db.collection('classes').add({
      name,
      description: description || '',
      code,
      teacherIds: [uid],
      members: [uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return res.json({ ok: true, id: docRef.id, code })
  } catch (err) {
    console.error('POST /api/classes error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/classes/join */
app.post('/api/classes/join', verify, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Missing code' })
    if (!adminInited) return res.status(400).json({ error: 'Not available in dev' })

    const snap = await db.collection('classes').where('code', '==', code).limit(1).get()
    if (snap.empty) return res.status(404).json({ error: 'Class not found' })
    const doc = snap.docs[0]
    await doc.ref.update({ members: admin.firestore.FieldValue.arrayUnion(req.user.uid) })
    return res.json({ ok: true, classId: doc.id })
  } catch (err) {
    console.error('POST /api/classes/join error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* GET /api/classes/:id
   doc fetch then membership check (no compound query)
   fetch assignments/files/sessions safely (sort server-side when needed)
*/
app.get('/api/classes/:id', verify, async (req, res) => {
  try {
    const { id } = req.params
    if (!adminInited) {
      return res.json({ klass: { id, name: 'Demo Class', code: 'DEMO01' }, assignments: [], sessions: [] })
    }

    const cRef = db.collection('classes').doc(id)
    const cSnap = await cRef.get()
    if (!cSnap.exists) return res.status(404).json({ error: 'Class not found' })
    const c = cSnap.data()

    const uid = req.user.uid
    const userRole = await getUserRole(uid)

    const isTeacher = Array.isArray(c.teacherIds) && c.teacherIds.includes(uid)
    const isMember = Array.isArray(c.members) && c.members.includes(uid)
    if (!(isTeacher || isMember || userRole === 'admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const [assignSnap, filesSnap, sessSnap] = await Promise.all([
      cRef.collection('assignments').orderBy('createdAt', 'desc').get(),
      cRef.collection('files').orderBy('createdAt', 'desc').get(),
      db.collection('attendance_sessions').where('classId', '==', id).get()
    ])

    const assignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const files = filesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const sessions = sessSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt))

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

/* POST /api/attendance_sessions -> create session (teacher/admin of that class only) */
app.post('/api/attendance_sessions', verify, async (req, res) => {
  try {
    const { classId } = req.body
    if (!classId) return res.status(400).json({ error: 'Missing classId' })
    if (!adminInited) return res.status(400).json({ error: 'Not available in dev' })

    // check permission: teacher or admin and teacher of that class
    const uid = req.user.uid
    const role = await getUserRole(uid)
    if (!['teacher', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' })

    const cSnap = await db.collection('classes').doc(classId).get()
    if (!cSnap.exists) return res.status(404).json({ error: 'Class not found' })
    const c = cSnap.data()
    const isTeacherOfClass = Array.isArray(c.teacherIds) && c.teacherIds.includes(uid)
    if (!(isTeacherOfClass || role === 'admin')) return res.status(403).json({ error: 'Not teacher of this class' })

    const docRef = await db.collection('attendance_sessions').add({ classId, createdAt: admin.firestore.FieldValue.serverTimestamp() })
    return res.json({ id: docRef.id })
  } catch (err) {
    console.error('POST /api/attendance_sessions error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* DELETE /api/attendance_sessions/:id -> only teacher/admin of that class */
app.delete('/api/attendance_sessions/:id', verify, async (req, res) => {
  try {
    const sid = req.params.id
    if (!adminInited) return res.status(400).json({ error: 'Not available in dev' })
    const sSnap = await db.collection('attendance_sessions').doc(sid).get()
    if (!sSnap.exists) return res.status(404).json({ error: 'Session not found' })
    const s = sSnap.data()
    const classId = s.classId
    const uid = req.user.uid
    const role = await getUserRole(uid)
    const cSnap = await db.collection('classes').doc(classId).get()
    const c = cSnap.data()
    const isTeacherOfClass = Array.isArray(c.teacherIds) && c.teacherIds.includes(uid)
    if (!(isTeacherOfClass || role === 'admin')) return res.status(403).json({ error: 'Forbidden' })
    await db.collection('attendance_sessions').doc(sid).delete()
    return res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/attendance_sessions/:id error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/attendance_records */
app.post('/api/attendance_records', verify, async (req, res) => {
  try {
    const { sessionId, classId } = req.body
    if (!sessionId || !classId) return res.status(400).json({ error: 'Missing fields' })

    if (!adminInited) {
      const rid = 'dev-' + Date.now()
      return res.json({ ok: true, id: rid })
    }

    const recordRef = await db.collection('attendance_records').add({
      sessionId, classId, uid: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return res.json({ ok: true, id: recordRef.id })
  } catch (err) {
    console.error('POST /api/attendance_records error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/classes/:id/assignments
   Only teacher/admin of that class can create assignment.
   payload: { title, description, type }  (type: 'assignment'|'question'|'material'|'quiz' etc)
*/
app.post('/api/classes/:id/assignments', verify, async (req, res) => {
  try {
    const classId = req.params.id
    const { title, description, type } = req.body
    if (!title) return res.status(400).json({ error: 'Missing title' })

    if (!adminInited) {
      const aid = 'dev-' + Date.now()
      return res.json({ id: aid })
    }

    const uid = req.user.uid
    const role = await getUserRole(uid)
    if (!['teacher', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' })

    const cSnap = await db.collection('classes').doc(classId).get()
    if (!cSnap.exists) return res.status(404).json({ error: 'Class not found' })
    const c = cSnap.data()
    const isTeacherOfClass = Array.isArray(c.teacherIds) && c.teacherIds.includes(uid)
    if (!(isTeacherOfClass || role === 'admin')) return res.status(403).json({ error: 'Not teacher of this class' })

    const docRef = await db.collection('classes').doc(classId)
      .collection('assignments').add({
        title,
        description: description || '',
        type: type || 'assignment',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    return res.json({ id: docRef.id })
  } catch (err) {
    console.error('POST /api/classes/:id/assignments error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* GET /api/assignments
   Return assignments across classes user belongs to (include className and classId)
*/
app.get('/api/assignments', verify, async (req, res) => {
  try {
    if (!adminInited) {
      return res.json([])
    }
    const uid = req.user.uid
    const role = await getUserRole(uid)

    // get classes user can see
    const classSnap = role === 'admin' ?
      await db.collection('classes').get() :
      await db.collection('classes').where('members', 'array-contains', uid).get()

    const classes = classSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    const allAssignments = []
    for (const c of classes) {
      const aSnap = await db.collection('classes').doc(c.id).collection('assignments').orderBy('createdAt','desc').get()
      aSnap.docs.forEach(ad => {
        allAssignments.push({
          id: ad.id,
          classId: c.id,
          className: c.name,
          ...ad.data()
        })
      })
    }

    // sort by createdAt
    allAssignments.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt))
    return res.json(allAssignments)
  } catch (err) {
    console.error('GET /api/assignments error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/assignments/:assignmentId/submit
   file upload -> drive, then record metadata
   expects multipart/form-data with 'file' and 'classId' (and optional fields)
*/
app.post('/api/assignments/:assignmentId/submit', upload.single('file'), verify, async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId
    const classId = req.body.classId || req.query.classId
    if (!req.file) return res.status(400).json({ error: 'Missing file' })
    if (!driveClient) return res.status(400).json({ error: 'Drive not configured' })

    // upload to Drive
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

    if (adminInited) {
      await db.collection('classes').doc(classId).collection('assignments').doc(assignmentId)
        .collection('submissions').add({
          uid: req.user.uid,
          fileId,
          fileName: req.file.originalname,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    }

    return res.json({ ok: true, fileId })
  } catch (err) {
    console.error('POST /api/assignments/:assignmentId/submit error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* POST /api/reports
   Upload report (duty) to Drive and save metadata to 'reports' collection.
   Only teacher/admin allowed to create report (but students could submit duty if needed)
*/
app.post('/api/reports', upload.single('file'), verify, async (req, res) => {
  try {
    const { title, classId } = req.body
    if (!title) return res.status(400).json({ error: 'Missing title' })
    if (!req.file) return res.status(400).json({ error: 'Missing file' })
    if (!driveClient) return res.status(400).json({ error: 'Drive not configured' })

    const uid = req.user.uid
    const role = await getUserRole(uid)
    if (!['teacher', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' })

    const mimeType = req.file.mimetype || 'application/octet-stream'
    const parent = process.env.DRIVE_PARENT_FOLDER_ID || null
    const driveRes = await driveClient.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: parent ? [parent] : undefined
      },
      media: { mimeType, body: Buffer.from(req.file.buffer) }
    })

    const fileId = driveRes.data.id

    if (adminInited) {
      await db.collection('reports').add({
        title,
        classId: classId || null,
        fileId,
        fileName: req.file.originalname,
        uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    return res.json({ ok: true, fileId })
  } catch (err) {
    console.error('POST /api/reports error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* Admin: create auth user + users/{uid} doc */
app.post('/api/admin/users', verify, async (req, res) => {
  try {
    if (!adminInited) return res.status(400).json({ error: 'Admin require Firebase service account' })
    const { email, role } = req.body
    const uid = req.user.uid
    const userDoc = await db.collection('users').doc(uid).get()
    const userRole = userDoc.exists ? userDoc.data().role : null
    if (userRole !== 'admin') return res.status(403).json({ error: 'Forbidden' })

    const userRecord = await auth.createUser({ email, password: 'ChangeMe123!' })
    await db.collection('users').doc(userRecord.uid).set({ email, role, createdAt: admin.firestore.FieldValue.serverTimestamp() })
    return res.json({ ok: true, uid: userRecord.uid })
  } catch (err) {
    console.error('POST /api/admin/users error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* Serve frontend build if exists */
const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server listening on', PORT))
