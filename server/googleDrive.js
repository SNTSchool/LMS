import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/drive']
})

export const drive = google.drive({ version: 'v3', auth })

export async function createClassFolder(className) {
  const res = await drive.files.create({
    requestBody: {
      name: className,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.SHARED_DRIVE_ID]
    },
    supportsAllDrives: true
  })
  return res.data.id
}
