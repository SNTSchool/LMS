import { auth } from '../firebaseAdmin.js'

export async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' })
  }

  const token = header.split('Bearer ')[1]

  try {
    const decoded = await auth.verifyIdToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
