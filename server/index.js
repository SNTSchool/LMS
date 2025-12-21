// server/index.js
import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'

/* =========================================================
   Firebase Admin Init
========================================================= */

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT env')
  process.exit(1)
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

/* =========================================================
   App
========================================================= */

const app = express()
app.use(cors())
app.use(express.json())

/* =========================================================
   Helpers
========================================================= */

function genRoomCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

// 🔓 TEMP AUTH — allow everything
function verifyIdTokenFromHeader(req, res, next) {
  req.user = { uid: 'dev-user', email: 'dev@local' }
  req.userRole = 'admin'
  next()
}

/* =========================================================
   ROUTES
========================================================= */

/* ---------------------------------------------------------
   GET /api/classes
--------------------------------------------------------- */
app.get('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const snap = await db.collection('classes').get()
    const classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return res.json(classes)
  } catch (err) {
    console.error('GET /api/classes:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   POST /api/classes
--------------------------------------------------------- */
app.post('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })

    let code, exists = true, attempt = 0
    do {
      code = genRoomCode(6)
      const q = await db.collection('classes')
        .where('code', '==', code)
        .limit(1)
        .get()
      exists = !q.empty
      attempt++
    } while (exists && attempt < 10)

    const docRef = await db.collection('classes').add({
      name,
      description: description || '',
      code,
      teacherIds: ['dev-user'],
      members: ['dev-user'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return res.json({ ok: true, id: docRef.id, code })
  } catch (err) {
    console.error('POST /api/classes:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   POST /api/classes/join
--------------------------------------------------------- */
app.post('/api/classes/join', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Missing code' })

    const snap = await db.collection('classes')
      .where('code', '==', code)
      .limit(1)
      .get()

    if (snap.empty) {
      return res.status(404).json({ error: 'Class not found' })
    }

    const doc = snap.docs[0]

    await doc.ref.update({
      members: admin.firestore.FieldValue.arrayUnion(req.user.uid)
    })

    return res.json({ ok: true, classId: doc.id })
  } catch (err) {
    console.error('JOIN CLASS:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   GET /api/classes/:classId
--------------------------------------------------------- */
app.get('/api/classes/:classId', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { classId } = req.params
    const cRef = db.collection('classes').doc(classId)
    const cSnap = await cRef.get()

    if (!cSnap.exists) {
      return res.status(404).json({ error: 'Class not found' })
    }

    const c = cSnap.data()

    const assignmentsSnap = await cRef.collection('assignments').get()
    const filesSnap = await cRef.collection('files').get()

    let sessions = []
    try {
      const sessSnap = await db.collection('attendance_sessions')
        .where('classId', '==', classId)
        .get()
      sessions = sessSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {
      sessions = []
    }

    return res.json({
      klass: { id: classId, ...c },
      assignments: assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      files: filesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      sessions
    })
  } catch (err) {
    console.error('CLASS DETAIL:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* =========================================================
   Start
========================================================= */

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('Server listening on', PORT)
})
