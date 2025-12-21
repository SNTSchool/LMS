import { google } from 'googleapis'
import admin from 'firebase-admin'

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/drive']
})

export const drive = google.drive({
  version: 'v3',
  auth
})

export async function ensureFolder(name, parentId) {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents`
  const res = await drive.files.list({ q })
  if (res.data.files.length > 0) return res.data.files[0].id

  const folder = await drive.files.create({
    resource: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    fields: 'id'
  })

  return folder.data.id
}
