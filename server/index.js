import express from 'express'
import cors from 'cors'
import { db } from './firebaseAdmin.js'
import { createClassFolder } from './googleDrive.js'
import { requireAuth } from './authMiddleware.js'

const app = express()
app.use(cors())
app.use(express.json())

/* CREATE CLASS */
app.post('/api/classes', requireAuth, async (req, res) => {
  if (!['admin', 'instructor'].includes(req.role)) {
    return res.status(403).send('Forbidden')
  }

  const { name, description } = req.body

  const folderId = await createClassFolder(name)

  const ref = await db.collection('classes').add({
    name,
    description,
    teacherId: req.user.uid,
    driveFolderId: folderId,
    createdAt: new Date()
  })

  res.json({ id: ref.id })
})

/* LIST CLASSES */
app.get('/api/classes', requireAuth, async (req, res) => {
  let q = db.collection('classes')
  if (req.role === 'instructor') {
    q = q.where('teacherId', '==', req.user.uid)
  }
  const snap = await q.get()
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
})

app.listen(process.env.PORT || 3000)
