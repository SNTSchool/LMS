// src/routes/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import apiFetch from '../api/apiFetch'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setUserData(null)
        setLoading(false)
        return
      }

      setUser(firebaseUser)

      try {
        // ดึง role จาก backend
        const me = await apiFetch('/api/me')
        setUserData(me)
      } catch (err) {
        console.error('load userData error', err)
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