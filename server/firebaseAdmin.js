import admin from 'firebase-admin'

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FB_PROJECT_ID,
    clientEmail: process.env.FB_CLIENT_EMAIL,
    privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
})


export const db = admin.firestore()
export const auth = admin.auth()
