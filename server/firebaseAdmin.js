import admin from 'firebase-admin'

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

export const db = admin.firestore()
export const auth = admin.auth()
