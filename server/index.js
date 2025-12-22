import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const auth = admin.auth()

const app = express()
app.use(cors())
app.use(express.json())

async function verify(req, res, next) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' })
  }
  try {
    const decoded = await auth.verifyIdToken(h.split(' ')[1])
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/* ---------- Classes ---------- */

app.get('/api/classes', verify, async (req, res) => {
  const snap = await db.collection('classes')
    .where('members', 'array-contains', req.user.uid)
    .get()

  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
})

app.post('/api/classes', verify, async (req, res) => {
  const { name } = req.body
  const ref = await db.collection('classes').add({
    name,
    members: [req.user.uid],
    teacherIds: [req.user.uid],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })
  res.json({ id: ref.id })
})

app.get('/api/classes/:id', verify, async (req, res) => {
  const ref = db.collection('classes').doc(req.params.id)
  const snap = await ref.get()
  if (!snap.exists) return res.status(404).json({})

  res.json({
    klass: { id: snap.id, ...snap.data() },
    assignments: [],
    sessions: []
  })
})

app.listen(process.env.PORT || 3000, () =>
  console.log('Backend running')
)
