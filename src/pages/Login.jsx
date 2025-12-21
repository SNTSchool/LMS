import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth'
import { auth, googleProvider, db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  /* ---------- EMAIL / PASSWORD ---------- */
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (!snap.exists()) {
        await Swal.fire({
          icon: 'error',
          title: 'ไม่อนุญาตให้เข้าใช้งาน',
          text: 'บัญชีนี้ไม่ได้อยู่ในระบบ'
        })
        await auth.signOut()
        return
      }

      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        timer: 1200,
        showConfirmButton: false
      })

      navigate('/')
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  /* ---------- GOOGLE LOGIN ---------- */
  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) {
        await Swal.fire({
          icon: 'error',
          title: 'ไม่อนุญาตให้เข้าใช้งาน',
          text: 'บัญชี Google นี้ไม่ได้อยู่ในระบบ'
        })
        await auth.signOut()
        return
      }

      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบด้วย Google',
        timer: 1000,
        showConfirmButton: false
      })

      navigate('/')
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: err.message
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          UniPortal
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          ระบบบริหารจัดการเรียนการสอน
        </p>

        {/* EMAIL LOGIN */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
            className="w-full p-3 border rounded-lg"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            className="w-full p-3 border rounded-lg"
            required
          />

          <button
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* GOOGLE LOGIN */}
        <div className="mt-4">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
          >
            {/* Google SVG Icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              className="bg-white rounded-full p-1"
            >
              <path
                fill="#4285F4"
                d="M24 9.5c3.54 0 6.03 1.53 7.41 2.81l5.45-5.45C33.47 3.86 28.97 1.5 24 1.5 14.84 1.5 6.91 6.89 3.25 14.68l6.36 4.94C11.28 13.02 17.19 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.5 24.5c0-1.63-.15-3.2-.43-4.72H24v9.03h12.7c-.55 2.9-2.18 5.36-4.63 7.03l7.17 5.58C43.43 37.02 46.5 31.25 46.5 24.5z"
              />
              <path
                fill="#FBBC05"
                d="M9.61 28.63A14.4 14.4 0 0 1 9 24c0-1.62.28-3.18.61-4.63l-6.36-4.94A23.97 23.97 0 0 0 1.5 24c0 3.87.92 7.53 2.75 10.57l6.36-4.94z"
              />
              <path
                fill="#EA4335"
                d="M24 46.5c6.48 0 11.91-2.14 15.88-5.78l-7.17-5.58c-1.99 1.33-4.53 2.13-8.71 2.13-6.81 0-12.72-3.52-15.36-8.71l-6.36 4.94C6.91 41.11 14.84 46.5 24 46.5z"
              />
            </svg>

            Sign in with Google
          </button>
        </div>

        <div className="text-xs text-slate-400 mt-4 text-center">
          บัญชีต้องถูกสร้างโดยผู้ดูแลระบบก่อนเท่านั้น
        </div>
      </div>
    </div>
  )
}
