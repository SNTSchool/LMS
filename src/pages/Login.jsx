import React from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const snap = await getDoc(doc(db, 'users', user.uid))

      if (!snap.exists()) {
        await Swal.fire({
          icon: 'error',
          title: 'ไม่อนุญาตให้เข้าใช้งาน',
          text: 'บัญชีนี้ไม่ได้อยู่ในระบบ'
        })
        await auth.signOut()
        return
      }

      const role = snap.data().role

      if (role === 'admin') navigate('/admin')
      else if (role === 'instructor') navigate('/instructor')
      else navigate('/')

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: err.message
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <button
        onClick={handleGoogleLogin}
        className="px-6 py-3 bg-red-500 text-white rounded"
      >
        Sign in with Google
      </button>
    </div>
  )
}
