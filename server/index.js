// server/index.js
import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'
import multer from 'multer'
const upload = multer({ storage: multer.memoryStorage() })

/* =========================================================
   ENV CHECK
========================================================= */
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ Missing FIREBASE_SERVICE_ACCOUNT env')
  process.exit(1)
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

/* =========================================================
   Firebase Admin Init
========================================================= */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

/* =========================================================
   App Init
========================================================= */
const app = express()
app.use(cors())
app.use(express.json())

/* =========================================================
   Helpers
========================================================= */

// generate case-sensitive class code
function genRoomCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

/**
 * 🔓 TEMP AUTH (DEV MODE)
 * - ไม่มี 401
 * - ทุก request ผ่าน
 * - แกล้งเป็น admin
 */
function verifyIdTokenFromHeader(req, res, next) {
  req.user = {
    uid: 'dev-user-001',
    email: 'dev@local'
  }
  req.userRole = 'admin' // admin / instructor / student
  next()
}

/* =========================================================
   ROUTES
========================================================= */

/* ---------------------------------------------------------
   GET /api/classes
   - admin → เห็นทุกห้อง
   - user → เห็นเฉพาะห้องที่เป็นสมาชิก
--------------------------------------------------------- */
app.get('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const uid = req.user.uid
    const role = req.userRole

    let snap

    if (role === 'admin') {
      snap = await db.collection('classes').get()
    } else {
      snap = await db
        .collection('classes')
        .where('members', 'array-contains', uid)
        .get()
    }

    const classes = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))

    return res.json(classes)
  } catch (err) {
    console.error('GET /classes error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   POST /api/classes
   สร้างห้องเรียน
--------------------------------------------------------- */
app.post('/api/classes', verifyIdTokenFromHeader, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, description } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Missing name' })
    }

    // generate unique code
    let code, exists = true, attempt = 0
    do {
      code = genRoomCode(6)
      const q = await db
        .collection('classes')
        .where('code', '==', code)
        .limit(1)
        .get()

      exists = !q.empty
      attempt++
    } while (exists && attempt < 10)

    const docRef = await db.collection('classes').add({
      name,
      description: description || '',
      code,
      teacherIds: [req.user.uid],
      members: [req.user.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return res.json({
      ok: true,
      id: docRef.id,
      code
    })
  } catch (err) {
    console.error('POST /classes error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* ---------------------------------------------------------
   POST /api/classes/join
   เข้าเรียนด้วย code
--------------------------------------------------------- */
app.post('/api/classes/join', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.status(400).json({ error: 'Missing code' })
    }

    const snap = await db
      .collection('classes')
      .where('code', '==', code)
      .limit(1)
      .get()

    if (snap.empty) {
      return res.status(404).json({ error: 'Class not found' })
    }

    const doc = snap.docs[0]

    await doc.ref.update({
      members: admin.firestore.FieldValue.arrayUnion(req.user.uid)
    })

    return res.json({
      ok: true,
      classId: doc.id
    })
  } catch (err) {
    console.error('JOIN error:', err)
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/classes/:id/assignments', verifyIdTokenFromHeader, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { title, description, dueAt, type } = req.body
    const { id: classId } = req.params

    const ref = await db
      .collection(`classes/${classId}/assignments`)
      .add({
        title,
        description,
        type: type || 'file',
        dueAt: dueAt ? new Date(dueAt) : null,
        createdBy: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })

    res.json({ ok: true, id: ref.id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})




app.post(
  '/api/assignments/:assignmentId/submit',
  verifyIdTokenFromHeader,
  upload.single('file'),
  async (req, res) => {
    try {
      const { assignmentId } = req.params
      const uid = req.user.uid

      if (!req.file) {
        return res.status(400).json({ error: 'No file' })
      }

      // upload to Drive
      const driveRes = await drive.files.create({
        requestBody: {
          name: `${uid}_${req.file.originalname}`,
          parents: ['DRIVE_ASSIGNMENT_FOLDER_ID']
        },
        media: {
          mimeType: req.file.mimetype,
          body: Buffer.from(req.file.buffer)
        }
      })

      // save metadata
      await db
        .doc(`assignments/${assignmentId}/submissions/${uid}`)
        .set({
          studentId: uid,
          driveFileId: driveRes.data.id,
          fileName: req.file.originalname,
          submittedAt: admin.firestore.FieldValue.serverTimestamp()
        })

      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)


/* ---------------------------------------------------------
   GET /api/classes/:classId
   หน้า classroom จริง
--------------------------------------------------------- */
app.get('/api/classes/:classId', verifyIdTokenFromHeader, async (req, res) => {
  try {
    const { classId } = req.params

    const ref = db.collection('classes').doc(classId)
    const snap = await ref.get()

    if (!snap.exists) {
      return res.status(404).json({ error: 'Class not found' })
    }

    const klass = snap.data()
    const uid = req.user.uid
    const role = req.userRole

    const isTeacher = Array.isArray(klass.teacherIds) && klass.teacherIds.includes(uid)
    const isMember = Array.isArray(klass.members) && klass.members.includes(uid)

    if (!(isTeacher || isMember || role === 'admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // SAFE: subcollections (ไม่มี = empty)
    const assignmentsSnap = await ref.collection('assignments').get()
    const filesSnap = await ref.collection('files').get()

    let sessions = []
    try {
      const sessSnap = await db
        .collection('attendance_sessions')
        .where('classId', '==', classId)
        .get()

      sessions = sessSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {
      sessions = []
    }

    return res.json({
      klass: { id: classId, ...klass },
      assignments: assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      files: filesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      sessions
    })
  } catch (err) {
    console.error('CLASS DETAIL error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/* =========================================================
   START SERVER
========================================================= */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT)
})
