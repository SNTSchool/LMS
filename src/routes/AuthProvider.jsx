import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { auth, db } from '../firebaseConfig'

const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
  error: null
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // เริ่ม loading รอบใหม่ (ทุกครั้งที่ auth state เปลี่ยน)
      setLoading(true)
      setError(null)
      setUser(u)

      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid)
          const snap = await getDoc(userRef)

          if (snap.exists()) {
            const data = snap.data()
            setUserData(data)
            // ถ้าต้องการ debug ให้แสดงเป็น toast แบบไม่รบกวน
            // (commented out by default)
            // Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'User profile loaded', timer: 1200, showConfirmButton: false })
          } else {
            // ผู้ใช้ถูกสร้างใน Auth แต่ยังไม่มีเอกสาร profile ใน Firestore
            setUserData(null)
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'info',
              title: 'บัญชียังไม่มีโปรไฟล์ในฐานข้อมูล',
              text: 'กรุณาไปกรอกข้อมูลโปรไฟล์ (หรือให้แอดมินสร้างให้)',
              timer: 3500,
              showConfirmButton: false
            })
          }
        } catch (err) {
          setUserData(null)
          setError(err)
          // แสดง error ผ่าน SweetAlert2 แทน console.error
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้',
            text: err.message || String(err),
            confirmButtonColor: '#16a34a'
          })
        }
      } else {
        // logged out
        setUserData(null)
      }

      // ปิด loading หลังจากโหลด userData เสร็จ (หรือจับ error เสร็จ)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}