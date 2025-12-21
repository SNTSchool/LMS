// server/index.js
import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'
<<<<<<< HEAD
import { authMiddleware } from './middleware/auth.js'

=======
import multer from 'multer'
const upload = multer({ storage: multer.memoryStorage() })

/* =========================================================
   ENV CHECK
========================================================= */
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ Missing FIREBASE_SERVICE_ACCOUNT env')
  process.exit(1)
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

/* =========================================================
   Firebase Admin Init
========================================================= */
>>>>>>> parent of 33bbad9 (Update index.js)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  })
}

const db = admin.firestore()
const app = express()

app.use(cors())
app.use(express.json())

/* ----------------------------------------
   Utils
---------------------------------------- */
function genRoomCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function verifyIdTokenFromHeader(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }

  const idToken = header.split(' ')[1]

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    req.user = decoded

    const snap = await db.doc(`users/${decoded.uid}`).get()
    req.userRole = snap.exists ? snap.data().role : 'student'

    next()
  } catch (err) {
    console.error('verify token error', err)
    return res.status(401).json({ error: 'Invalid token' })
  }
}


/* ----------------------------------------
   GET /api/classes
---------------------------------------- */
app.get('/api/classes', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('classes').get()
    const classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(classes)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

/* ----------------------------------------
   POST /api/classes
---------------------------------------- */
app.post('/api/classes', authMiddleware, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })

    const code = genRoomCode()

    const ref = await db.collection('classes').add({
      name,
      description: description || '',
      code,
      teacherIds: [req.user.uid],
      members: [req.user.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ ok: true, id: ref.id, code })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

/* ----------------------------------------
   POST /api/classes/join
---------------------------------------- */
app.post('/api/classes/join', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body
    const snap = await db.collection('classes').where('code', '==', code).limit(1).get()

    if (snap.empty) return res.status(404).json({ error: 'Not found' })

    const doc = snap.docs[0]
    await doc.ref.update({
      members: admin.firestore.FieldValue.arrayUnion(req.user.uid)
    })

    res.json({ ok: true, classId: doc.id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

/* ----------------------------------------
   GET /api/classes/:id
---------------------------------------- */
app.get('/api/classes/:id', authMiddleware, async (req, res) => {
  try {
<<<<<<< HEAD
    const ref = db.collection('classes').doc(req.params.id)
=======
    const { sessionId } = req.params
    const uid = req.user.uid

    const sRef = db.collection('attendance_sessions').doc(sessionId)
    const sSnap = await sRef.get()

    if (!sSnap.exists) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const s = sSnap.data()
    if (!s.active) {
      return res.status(400).json({ error: 'Session closed' })
    }

    if (s.expiresAt.toMillis() < Date.now()) {
      await sRef.update({ active: false })
      return res.status(400).json({ error: 'Session expired' })
    }

    const rRef = sRef.collection('records').doc(uid)
    const rSnap = await rRef.get()

    if (rSnap.exists) {
      return res.status(409).json({ error: 'Already checked in' })
    }

    await rRef.set({
      uid,
      displayName: req.user.name || '',
      email: req.user.email || '',
      checkedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/attendance/sessions/:sessionId/close
app.post('/api/attendance/sessions/:sessionId/close', verifyIdTokenFromHeader, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { sessionId } = req.params

    await db.collection('attendance_sessions')
      .doc(sessionId)
      .update({ active: false })

    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})


// POST /api/classes/:classId/assignments
app.post('/api/classes/:classId/assignments', verifyIdTokenFromHeader, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { classId } = req.params
    const { title, description, type, dueAt } = req.body

    if (!title || !type) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const ref = db
      .collection('classes')
      .doc(classId)
      .collection('assignments')

    const doc = await ref.add({
      title,
      description: description || '',
      type, // file | text | link
      dueAt: dueAt ? admin.firestore.Timestamp.fromDate(new Date(dueAt)) : null,
      teacherId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ ok: true, id: doc.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/classes/:classId/assignments/:assignmentId/submit
app.post('/api/classes/:classId/assignments/:assignmentId/submit', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { classId, assignmentId } = req.params
    const { text, link, fileUrl } = req.body

    const ref = db
      .collection('classes')
      .doc(classId)
      .collection('assignments')
      .doc(assignmentId)
      .collection('submissions')
      .doc(req.user.uid)

    await ref.set({
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      text: text || null,
      link: link || null,
      fileUrl: fileUrl || null
    })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})




/* ---------------------------------------------------------
   GET /api/classes/:classId
   หน้า classroom จริง
--------------------------------------------------------- */
app.get('/api/classes/:classId', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { classId } = req.params

    const ref = db.collection('classes').doc(classId)
>>>>>>> parent of 33bbad9 (Update index.js)
    const snap = await ref.get()

    if (!snap.exists) return res.status(404).json({ error: 'Not found' })

    const data = snap.data()

    res.json({
      klass: { id: snap.id, ...data },
      assignments: [],
      attendanceSessions: [],
      files: []
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server running on', PORT))
