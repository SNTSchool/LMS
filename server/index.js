// server/index.js
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import stream from 'stream'
import admin from 'firebase-admin'
import { google } from 'googleapis'

/*
 REQUIRED ENV:
 - GOOGLE_SERVICE_ACCOUNT (JSON string)
 - SHARED_DRIVE_ID
*/

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.error('Missing GOOGLE_SERVICE_ACCOUNT env')
  process.exit(1)
}
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)

// init firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const db = admin.firestore()
const auth = admin.auth()

// init google drive (service account)
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
)
const drive = google.drive({ version: 'v3', auth: jwtClient })
const sheets = google.sheets({ version: 'v4', auth: jwtClient })

const SHARED_DRIVE_ID = process.env.SHARED_DRIVE_ID

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() })

// helper: verify id token and attach user + role
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.split('Bearer ')[1] : null
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const decoded = await auth.verifyIdToken(token)
    req.user = decoded
    const userSnap = await db.doc(`users/${decoded.uid}`).get()
    req.role = userSnap.exists ? userSnap.data().role : null
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// helper: create folder in shared drive (or find existing)
async function getOrCreateClassFolder(classId, className) {
  // try find folder with name class_<id>
  const q = `name = 'class_${classId}' and mimeType = 'application/vnd.google-apps.folder' and trashed=false and '${SHARED_DRIVE_ID}' in parents`
  const res = await drive.files.list({
    q,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: 'files(id, name)'
  })
  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id

  const r = await drive.files.create({
    requestBody: {
      name: `class_${classId}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [SHARED_DRIVE_ID]
    },
    supportsAllDrives: true,
    fields: 'id'
  })
  return r.data.id
}

/* ---------- CLASSES ---------- */
// create class: teacher/admin only
app.post('/api/classes', requireAuth, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.role)) return res.status(403).json({ error: 'Forbidden' })
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })
    const classRef = await db.collection('classes').add({
      name, description: description || '', teacherId: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    const classId = classRef.id
    const folderId = await getOrCreateClassFolder(classId, name)
    await classRef.update({ driveFolderId: folderId })
    res.json({ ok: true, classId, folderId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// list classes for user
app.get('/api/classes', requireAuth, async (req, res) => {
  try {
    let q = db.collection('classes')
    if (req.role === 'instructor') q = q.where('teacherId', '==', req.user.uid)
    else if (req.role === 'student') q = q.where('students', 'array-contains', req.user.uid)
    const snap = await q.get()
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// get class detail with assignments + sessions + files metadata
app.get('/api/classes/:classId', requireAuth, async (req, res) => {
  try {
    const { classId } = req.params
    const cSnap = await db.doc(`classes/${classId}`).get()
    if (!cSnap.exists) return res.status(404).json({ error: 'Class not found' })
    const klass = { id: cSnap.id, ...cSnap.data() }

    const [assignSnap, sessionSnap, fileSnap] = await Promise.all([
      db.collection(`classes/${classId}/assignments`).orderBy('createdAt', 'desc').get(),
      db.collection('attendance_sessions').where('classId', '==', classId).orderBy('createdAt', 'desc').get(),
      db.collection(`classes/${classId}/files`).orderBy('createdAt', 'desc').get()
    ])
    const assignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const sessions = sessionSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const files = fileSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json({ klass, assignments, sessions, files })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

/* ---------- ASSIGNMENTS ---------- */
// create assignment (instructor/admin)
app.post('/api/classes/:classId/assignments', requireAuth, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.role)) return res.status(403).json({ error: 'Forbidden' })
    const { classId } = req.params
    const { title, description, dueAt } = req.body
    if (!title) return res.status(400).json({ error: 'Missing title' })
    const ref = await db.collection(`classes/${classId}/assignments`).add({
      title, description: description || '', dueAt: dueAt || null, createdBy: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    res.json({ ok: true, id: ref.id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

/* ---------- UPLOAD SUBMISSION → Google Drive ---------- */
// submissions upload: form-data { file, assignmentId, classId }
app.post('/api/upload-submission', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { classId, assignmentId } = req.body
    if (!classId || !assignmentId) return res.status(400).json({ error: 'Missing classId or assignmentId' })
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file' })

    // ensure folder exists
    const cSnap = await db.doc(`classes/${classId}`).get()
    if (!cSnap.exists) return res.status(404).json({ error: 'Class not found' })
    let folderId = cSnap.data().driveFolderId
    if (!folderId) {
      folderId = await getOrCreateClassFolder(classId, cSnap.data().name || `class_${classId}`)
      await cSnap.ref.update({ driveFolderId: folderId })
    }

    // create or get assignment folder under class folder
    // look for folder named assignment_{assignmentId} under folderId
    const q = `name='assignment_${assignmentId}' and mimeType='application/vnd.google-apps.folder' and '${folderId}' in parents and trashed=false`
    const found = await drive.files.list({ q, supportsAllDrives: true, includeItemsFromAllDrives: true, fields: 'files(id,name)' })
    let assignFolderId
    if (found.data.files && found.data.files.length > 0) assignFolderId = found.data.files[0].id
    else {
      const rf = await drive.files.create({ requestBody: { name: `assignment_${assignmentId}`, mimeType: 'application/vnd.google-apps.folder', parents: [folderId] }, supportsAllDrives: true, fields: 'id' })
      assignFolderId = rf.data.id
    }

    // upload file to assignFolderId
    const bufferStream = new stream.PassThrough()
    bufferStream.end(file.buffer)
    const uploadRes = await drive.files.create({
      requestBody: { name: `${req.user.uid}_${file.originalname}`, parents: [assignFolderId] },
      media: { mimeType: file.mimetype, body: bufferStream },
      supportsAllDrives: true,
      fields: 'id, webViewLink'
    })
    const driveFileId = uploadRes.data.id
    const webViewLink = `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`

    // record submission metadata in Firestore
    await db.collection(`classes/${classId}/assignments/${assignmentId}/submissions`).add({
      ownerId: req.user.uid,
      ownerEmail: req.user.email || null,
      fileName: file.originalname,
      driveFileId,
      url: webViewLink,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ ok: true, url: webViewLink })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

/* ---------- SESSIONS (QR) ---------- */
// create session (instructor/admin)
app.post('/api/classes/:classId/sessions', requireAuth, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.role)) return res.status(403).json({ error: 'Forbidden' })
    const { classId } = req.params
    const { durationMinutes = 15 } = req.body
    const now = admin.firestore.Timestamp.now()
    const expires = admin.firestore.Timestamp.fromMillis(Date.now() + (durationMinutes * 60 * 1000))
    const ref = await db.collection('attendance_sessions').add({
      classId, createdBy: req.user.uid, createdAt: now, expiresAt: expires, active: true
    })
    res.json({ ok: true, sessionId: ref.id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// close session
app.post('/api/sessions/:sessionId/close', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const sRef = db.collection('attendance_sessions').doc(sessionId)
    const sSnap = await sRef.get()
    if (!sSnap.exists) return res.status(404).json({ error: 'Session not found' })
    if (!['admin', 'instructor'].includes(req.role) && sSnap.data().createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' })
    await sRef.update({ active: false })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// record attendance (student scans QR link and client posts here)
// body: { sessionId, classId }
app.post('/api/attendance/record', requireAuth, async (req, res) => {
  try {
    const { sessionId, classId } = req.body
    if (!sessionId || !classId) return res.status(400).json({ error: 'Missing sessionId or classId' })
    const sSnap = await db.collection('attendance_sessions').doc(sessionId).get()
    if (!sSnap.exists) return res.status(404).json({ error: 'Session not found' })
    const sData = sSnap.data()
    if (!sData.active) return res.status(400).json({ error: 'Session closed' })
    const now = admin.firestore.Timestamp.now()
    if (sData.expiresAt && sData.expiresAt.toMillis && now.toMillis() > sData.expiresAt.toMillis()) {
      // session expired -> mark inactive
      await sSnap.ref.update({ active: false })
      return res.status(400).json({ error: 'Session expired' })
    }

    // prevent duplicate: check if attendance already exists for this session and user
    const q = await db.collection('attendance_records')
      .where('sessionId', '==', sessionId)
      .where('userId', '==', req.user.uid)
      .get()
    if (!q.empty) return res.status(400).json({ error: 'Already recorded' })

    // record attendance
    const recRef = await db.collection('attendance_records').add({
      sessionId, classId, userId: req.user.uid, scannedAt: admin.firestore.FieldValue.serverTimestamp(), status: 'present'
    })
    res.json({ ok: true, recordId: recRef.id })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

/* ---------- EXPORT (CSV / Google Sheets) ---------- */
// Export attendance for class to CSV (returns CSV string) or create Google Sheet and return URL
app.get('/api/classes/:classId/export', requireAuth, async (req, res) => {
  try {
    const { classId } = req.params
    if (!['admin', 'instructor'].includes(req.role)) return res.status(403).json({ error: 'Forbidden' })

    // fetch attendance records
    const recSnap = await db.collection('attendance_records').where('classId', '==', classId).orderBy('scannedAt').get()
    const rows = [['userId', 'scannedAt', 'sessionId', 'status']]
    recSnap.forEach(doc => {
      const d = doc.data()
      rows.push([d.userId, d.scannedAt ? d.scannedAt.toDate().toISOString() : '', d.sessionId, d.status || ''])
    })

    const type = req.query.type || 'csv' // csv or sheet
    if (type === 'csv') {
      // convert rows to CSV
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="attendance_${classId}.csv"`)
      return res.send(csv)
    } else {
      // create Google Sheet
      const sheetRes = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: `attendance_${classId}_${Date.now()}` },
          sheets: [{ properties: { title: 'attendance' } }]
        }
      })
      const sheetId = sheetRes.data.spreadsheetId
      // write rows
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'attendance!A1',
        valueInputOption: 'RAW',
        requestBody: { values: rows }
      })
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}`
      return res.json({ ok: true, url })
    }
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server started on', PORT))
