import { createContext, useContext, useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          if (snap.exists()) {
            setUserData(snap.data())
          } else {
            // fallback ถ้ายังไม่มี doc
            setUserData({ role: 'student' })
          }
        } catch (e) {
          console.error('load userData error', e)
          setUserData(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
