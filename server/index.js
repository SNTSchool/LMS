// server/index.js
import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'

/*
REQUIRED ENV:
- FIREBASE_SERVICE_ACCOUNT (JSON string)
*/

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT env')
  process.exit(1)
}
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const db = admin.firestore()
const auth = admin.auth()

const app = express()
app.use(cors())
app.use(express.json())

/* ---------- Helpers ---------- */
function genRoomCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

async function verifyIdTokenFromHeader(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
  const idToken = header.split(' ')[1]
  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = decoded
    // load role from users/{uid}
    const udoc = await db.doc(`users/${decoded.uid}`).get()
    req.userRole = udoc.exists ? udoc.data().role : null
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/* ---------- Create class (instructor/admin) ---------- */
/*
POST /api/classes
body: { name, description }
returns: { ok: true, id, code }
*/
app.post('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const role = req.userRole
    if (!['instructor', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' })

    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })

    // ensure code unique (retry loop)
    let code, exists = true, attempt = 0
    do {
      code = genRoomCode(6)
      const q = await db.collection('classes').where('code', '==', code).limit(1).get()
      exists = !q.empty
      attempt++
      if (attempt > 10) break
    } while (exists)

    const docRef = await db.collection('classes').add({
      name,
      description: description || '',
      teacherIds: [req.user.uid],   // at least one teacher
      members: [req.user.uid],      // owner included
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      code,                         // case-sensitive code
    })

    return res.json({ ok: true, id: docRef.id, code })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------- Join by code ---------- */
/*
POST /api/classes/join
body: { code }
requires auth
If found, adds user uid to members array (if not exist) and returns classId
*/
app.post('/api/classes/join', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Missing code' })

    // case-sensitive query (Firestore queries are case-sensitive)
    const snap = await db.collection('classes').where('code', '==', code).limit(1).get()
    if (snap.empty) return res.status(404).json({ error: 'Class not found' })

    const cDoc = snap.docs[0]
    const cData = cDoc.data()
    const classId = cDoc.id

    // ensure user is not already member
    const uid = req.user.uid
    const members = cData.members || []
    if (!members.includes(uid)) {
      await db.collection('classes').doc(classId).update({
        members: admin.firestore.FieldValue.arrayUnion(uid)
      })
    }

    return res.json({ ok: true, classId })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------- Get class detail (only teacher/admin or member) ---------- */
/*
GET /api/classes/:classId
returns class doc + assignments + sessions + files metadata
*/
app.get('/api/classes/:classId', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { classId } = req.params
    const cSnap = await db.collection('classes').doc(classId).get()
    if (!cSnap.exists) return res.status(404).json({ error: 'Class not found' })
    const c = cSnap.data()

    const uid = req.user.uid
    const role = req.userRole

    // allow if teacher (in teacherIds), admin, or member
    const isTeacher = Array.isArray(c.teacherIds) && c.teacherIds.includes(uid)
    const isMember = Array.isArray(c.members) && c.members.includes(uid)
    if (!(isTeacher || isMember || role === 'admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // fetch subcollections (assignments, sessions, files metadata)
    const [assignSnap, sessSnap, filesSnap] = await Promise.all([
      db.collection(`classes/${classId}/assignments`).orderBy('createdAt', 'desc').get(),
      db.collection('attendance_sessions').where('classId', '==', classId).orderBy('createdAt', 'desc').get(),
      db.collection(`classes/${classId}/files`).orderBy('createdAt', 'desc').get()
    ])

    const assignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const sessions = sessSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const files = filesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    return res.json({ klass: { id: classId, ...c }, assignments, sessions, files })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------- Optional: create QR link helper (returns attend URL for session) ---------- */
/* You already have sessions endpoints; simply create session then QR points to /attendance/scan?session=ID&classId=ID */

/* ---------- Start ---------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server listening on', PORT))
