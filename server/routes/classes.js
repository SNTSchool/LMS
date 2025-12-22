import express from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      role: req.userRole,
      classes: []
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

export default router