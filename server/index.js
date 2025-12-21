// server/index.js
import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'
import { authMiddleware } from './middleware/auth.js'

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
    const ref = db.collection('classes').doc(req.params.id)
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
