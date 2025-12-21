import admin from 'firebase-admin'

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
})

export const auth = admin.auth()
export const db = admin.firestore()
