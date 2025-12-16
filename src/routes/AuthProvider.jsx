import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'

const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true)              // ⭐ สำคัญที่สุด
      setUser(u)

      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid)
          const snap = await getDoc(userRef)

          if (snap.exists()) {
            setUserData(snap.data())
          } else {
            console.warn('User exists in Auth but not in Firestore')
            setUserData(null)
          }
        } catch (err) {
          console.error('Failed to load user data:', err)
          setUserData(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)             // ⭐ หลัง Firestore เท่านั้น
    })

    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  )
}