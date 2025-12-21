import express from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { db } from '../firebaseAdmin.js'

const router = express.Router()

router.post('/', verifyFirebaseToken, async (req, res) => {
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ message: 'Missing class name' })
  }

  const code = generateClassCode() // aZ09 6 ตัว (case-sensitive)

  const doc = await db.collection('classes').add({
    name,
    code,
    instructors: [req.user.uid],
    students: [],
    createdAt: new Date()
  })

  res.json({ id: doc.id, code })
})

export default router
