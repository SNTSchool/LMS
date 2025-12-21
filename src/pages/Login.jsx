import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth'
import { auth, googleProvider, db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // ---------------- EMAIL / PASSWORD ----------------
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      // 🔒 เช็คว่ามี user ใน Firestore หรือไม่
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

  // ---------------- GOOGLE LOGIN ----------------
  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // 🔒 เช็คสิทธิ์
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
            <FcGoogle size={22} />
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
