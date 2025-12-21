import express from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import admin from 'firebase-admin'

const router = express.Router()
const db = admin.firestore()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid

    const snap = await db
      .collection('classes')
      .where('members', 'array-contains', uid)
      .get()

    const classes = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))

    return res.json(classes) // ⭐ array เท่านั้น
  } catch (e) {
    console.error(e)
    return res.json([]) // ⭐ อย่าคืน object
  }
})


export default router
