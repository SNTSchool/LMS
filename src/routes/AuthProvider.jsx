import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase' // IMPORTANT: firebase should export firestore db too

const AuthContext = createContext({ user: null, userData: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setUserData(null)
        setLoading(false)
        return
      }
      try {
        // read users/{uid} doc (role, displayName, etc.)
        const doc = await db.collection('users').doc(u.uid).get()
        if (doc.exists) setUserData(doc.data())
        else setUserData(null)
      } catch (err) {
        console.error('Failed to load userData', err)
        setUserData(null)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => useContext(AuthContext)
