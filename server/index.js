import express from 'express'
import cors from 'cors'
import multer from 'multer'
import admin from 'firebase-admin'

/* ===== Firebase Admin ===== */
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
})

const db = admin.firestore()

/* ===== App ===== */
const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() })

/* ===== Auth Middleware ===== */
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/* ===== Role Check ===== */
async function adminOnly(req, res, next) {
  const snap = await db.doc(`users/${req.user.uid}`).get()
  if (!snap.exists || snap.data().role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}

/* ===== Admin Create User ===== */
app.post('/api/admin/create-user', authMiddleware, adminOnly, async (req, res) => {
  const { email, password, role } = req.body

  try {
    const user = await admin.auth().createUser({
      email,
      password
    })

    await db.doc(`users/${user.uid}`).set({
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ success: true, uid: user.uid })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

/* ===== Example Upload (Google Drive จะต่อเพิ่มได้) ===== */
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  res.json({
    filename: req.file.originalname,
    uid: req.user.uid
  })
})

/* ===== Start ===== */
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log('Backend running on port', PORT)
})
