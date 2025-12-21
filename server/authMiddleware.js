import { auth, db } from './firebaseAdmin.js'

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).send('Unauthorized')

  try {
    const decoded = await auth.verifyIdToken(token)
    req.user = decoded

    const snap = await db.doc(`users/${decoded.uid}`).get()
    req.role = snap.data()?.role

    next()
  } catch {
    res.status(401).send('Invalid token')
  }
}
