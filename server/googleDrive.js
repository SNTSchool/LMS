import { google } from 'googleapis'
import admin from 'firebase-admin'

const auth = new google.auth.JWT(
  admin.credential.applicationDefault().clientEmail,
  null,
  admin.credential.applicationDefault().privateKey,
  ['https://www.googleapis.com/auth/drive']
)

export const drive = google.drive({
  version: 'v3',
  auth
})
