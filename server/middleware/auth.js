import admin from '../firebaseAdmin.js'

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' })
    }

    const token = authHeader.replace('Bearer ', '').trim()

    const decoded = await admin.auth().verifyIdToken(token)

    req.user = decoded   // uid, email, etc.
    next()
  } catch (err) {
    console.error('AUTH ERROR:', err.message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}
