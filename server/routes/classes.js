import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import admin from '../firebaseAdmin.js'

const router = express.Router()
const db = admin.firestore()

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Missing name' })
    }

    const code = Math.random().toString(36).substring(2, 8)

    const ref = await db.collection('classes').add({
      name,
      description: description || '',
      code,
      instructors: [req.user.uid],
      students: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({
      id: ref.id,
      code
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
