import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'
import Swal from 'sweetalert2'

const AuthContext = createContext()

const value = {
  user,
  userData, // { role, name, ... }
  loading
}


export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          if (!snap.exists()) {
            Swal.fire({
              icon: 'error',
              title: 'ไม่มีสิทธิ์เข้าใช้งาน',
              text: 'บัญชีนี้ยังไม่ถูกสร้างในระบบ'
            })
            await auth.signOut()
            return
          }
          setUserData(snap.data())
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ',
            text: err.message
          })
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
