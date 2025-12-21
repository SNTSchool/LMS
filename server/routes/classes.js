import express from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import admin from 'firebase-admin'

const router = express.Router()
const db = admin.firestore()

router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const snap = await db
      .collection('classes')
      .where('teacherId', '==', req.user.uid)
      .get()

    const classes = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))

    res.json(classes)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
