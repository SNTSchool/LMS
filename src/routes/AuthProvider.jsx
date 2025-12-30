import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true
})

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
        const ref = doc(db, 'users', u.uid)
        const snap = await getDoc(ref)

        if (snap.exists()) {
          setUserData(snap.data()) // <-- role จะมาจากตรงนี้
        } else {
          setUserData({ role: 'student' })
        }
      } catch (err) {
        console.error('load userData error', err)
        setUserData({ role: 'student' })
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
