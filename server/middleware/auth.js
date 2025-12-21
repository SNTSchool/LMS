import admin from 'firebase-admin'

export async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || ''

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' })
  }

  const token = header.replace('Bearer ', '')

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
