import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT')
  process.exit(1)
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()
const auth = admin.auth()

const app = express()
app.use(cors())
app.use(express.json())

/* ---------------- AUTH ---------------- */
async function verifyIdTokenFromHeader(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = await auth.verifyIdToken(token)
    req.user = decoded

    const snap = await db.doc(`users/${decoded.uid}`).get()
    req.userRole = snap.exists ? snap.data().role : 'student'

    next()
  } catch (e) {
    console.error(e)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/* ---------------- HELPERS ---------------- */
function genRoomCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

/* ---------------- CLASSES ---------------- */

// GET all classes user joined
app.get('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  const uid = req.user.uid
  const role = req.userRole

  let snap
  if (role === 'admin') {
    snap = await db.collection('classes').orderBy('createdAt', 'desc').get()
  } else {
    snap = await db
      .collection('classes')
      .where('members', 'array-contains', uid)
      .orderBy('createdAt', 'desc')
      .get()
  }

  const classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  res.json(classes)
})

// CREATE class
app.post('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  if (!['teacher', 'admin'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'Missing name' })

  let code
  while (true) {
    code = genRoomCode()
    const q = await db.collection('classes').where('code', '==', code).limit(1).get()
    if (q.empty) break
  }

  const ref = await db.collection('classes').add({
    name,
    description: description || '',
    code,
    teacherIds: [req.user.uid],
    members: [req.user.uid],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  res.json({ id: ref.id, code })
})

// JOIN class
app.post('/api/classes/join', verifyIdTokenFromHeader, async (req, res) => {
  const { code } = req.body
  const snap = await db.collection('classes').where('code', '==', code).limit(1).get()

  if (snap.empty) {
    return res.status(404).json({ error: 'Class not found' })
  }

  const doc = snap.docs[0]
  await doc.ref.update({
    members: admin.firestore.FieldValue.arrayUnion(req.user.uid)
  })

  res.json({ classId: doc.id })
})

// CLASS DETAIL
app.get('/api/classes/:id', verifyIdTokenFromHeader, async (req, res) => {
  const ref = db.collection('classes').doc(req.params.id)
  const snap = await ref.get()

  if (!snap.exists) return res.status(404).json({ error: 'Not found' })

  const c = snap.data()
  const uid = req.user.uid

  if (
    !c.members.includes(uid) &&
    !c.teacherIds.includes(uid) &&
    req.userRole !== 'admin'
  ) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  res.json({ id: snap.id, ...c })
})

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server running on', PORT))