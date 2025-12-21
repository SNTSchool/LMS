import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()

    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // 🔒 เช็คว่ามี user ใน Firestore หรือไม่
      const snap = await getDoc(doc(db, 'users', user.uid))

      if (!snap.exists()) {
        await Swal.fire({
          icon: 'error',
          title: 'ไม่อนุญาตให้เข้าใช้งาน',
          text: 'บัญชีนี้ไม่ได้รับอนุญาตในระบบ'
        })

        await auth.signOut()
        return
      }

      const role = snap.data().role

      await Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        timer: 1000,
        showConfirmButton: false
      })

      // 🔀 redirect ตาม role
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
      <div className="bg-white p-8 rounded shadow w-full max-w-sm text-center space-y-4">
        <h1 className="text-xl font-bold">UniPortal Login</h1>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
