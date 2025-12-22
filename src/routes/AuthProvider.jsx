import { createContext, useContext, useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()

    return onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        setUserData(snap.exists() ? snap.data() : { role: 'student' })
      } else {
        setUserData(null)
      }

      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)