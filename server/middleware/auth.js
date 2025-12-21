// server/middleware/auth.js
import admin from 'firebase-admin'
import db from '../firebaseAdmin.js'

export async function authMiddleware(req, res, next) {
  // 🔓 TEMP BYPASS AUTH (ใช้ได้ทุกกรณี)
  req.user = {
    uid: 'dev-user',
    email: 'dev@local'
  }

  // role: admin | teacher | student
  req.userRole = 'admin'

  next()
}
