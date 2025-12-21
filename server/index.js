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

/* ---------- Firebase Admin Init (safe) ---------- */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()
const auth = admin.auth()

/* ---------- App ---------- */
const app = express()
app.use(cors())
app.use(express.json())

/* =========================================================
   Helpers
========================================================= */

function genRoomCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

// 🔓 TEMP: allow all (NO 401)
async function verifyIdTokenFromHeader(req, res, next) {
  req.user = {
    uid: 'dev-user',
    email: 'dev@local'
  }
  req.userRole = 'admin' // instructor / admin / student ก็ได้
  next()
}
/* =========================================================
   ROUTES
========================================================= */

/* ---------------------------------------------------------
   GET /api/classes   ⭐⭐⭐ (สำคัญมาก)
   ดึงห้องเรียนที่ user เป็นสมาชิก / ครู
--------------------------------------------------------- */
app.get('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const uid = req.user.uid
    const role = req.userRole

    let classes = []

    if (role === 'admin') {
      // admin เห็นทุกห้อง
      const snap = await db.collection('classes')
        .orderBy('createdAt', 'desc')
        .get()

      classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } else {
      // teacher / student เห็นเฉพาะที่เข้าร่วม
      const snap = await db.collection('classes')
        .where('members', 'array-contains', uid)
        .orderBy('createdAt', 'desc')
        .get()

      classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }

    return res.json(classes)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   POST /api/classes
   สร้างห้องเรียน (instructor / admin เท่านั้น)
--------------------------------------------------------- */
app.post('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  try {
    if (!['instructor', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })

    // generate unique code
    let code, exists = true, attempt = 0
    do {
      code = genRoomCode(6)
      const q = await db.collection('classes')
        .where('code', '==', code)
        .limit(1)
        .get()

      exists = !q.empty
      attempt++
    } while (exists && attempt < 10)

    const docRef = await db.collection('classes').add({
      name,
      description: description || '',
      code,                         // case-sensitive
      teacherIds: [req.user.uid],   // ต้องมีครูอย่างน้อย 1
      members: [req.user.uid],      // owner เป็น member
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return res.json({
      ok: true,
      id: docRef.id,
      code
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   POST /api/classes/join
   เข้าห้องเรียนด้วย code
--------------------------------------------------------- */
app.post('/api/classes/join', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Missing code' })

    const snap = await db.collection('classes')
      .where('code', '==', code)
      .limit(1)
      .get()

    if (snap.empty) {
      return res.status(404).json({ error: 'Class not found' })
    }

    const doc = snap.docs[0]
    const uid = req.user.uid

    await doc.ref.update({
      members: admin.firestore.FieldValue.arrayUnion(uid)
    })

    return res.json({ ok: true, classId: doc.id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   GET /api/classes/:classId
   เข้าหน้าห้องเรียนจริง
--------------------------------------------------------- */
app.get('/api/classes/:classId', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { classId } = req.params

    const cRef = db.collection('classes').doc(classId)
    const cSnap = await cRef.get()

    if (!cSnap.exists) {
      return res.status(404).json({ error: 'Class not found' })
    }

    const c = cSnap.data()

    // 🔒 (คุณ bypass แล้ว แต่คงไว้)
    const uid = req.user.uid
    const role = req.userRole

    const isTeacher = Array.isArray(c.teacherIds) && c.teacherIds.includes(uid)
    const isMember = Array.isArray(c.members) && c.members.includes(uid)
    if (!(isTeacher || isMember || role === 'admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // ✅ SAFE FETCH (ถ้าไม่มีจะได้ empty array)
    const assignmentsSnap = await cRef.collection('assignments').get()
    const filesSnap = await cRef.collection('files').get()

   let sessions = []

try {
  const sessSnap = await db
    .collection('attendance_sessions')
    .where('classId', '==', classId)
    .get()

  sessions = sessSnap.docs.map(d => ({ id: d.id, ...d.data() }))
} catch (e) {
  console.warn('attendance_sessions not ready yet')
  sessions = []
}

    const assignments = assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const files = filesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    return res.json({
      klass: { id: classId, ...c },
      assignments,
      sessions,
      files
    })

  } catch (err) {
    console.error('CLASS DETAIL ERROR:', err)
    return res.status(500).json({ error: err.message })
  }
})


/* =========================================================
   Start Server
========================================================= */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('Server listening on', PORT)
})
