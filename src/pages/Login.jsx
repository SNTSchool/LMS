import React, { useState } from 'react'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebaseConfig'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1000, showConfirmButton: false })
      navigate('/')
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message })
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบด้วย Google', timer: 1000, showConfirmButton: false })
      navigate('/')
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50">
      <div className="bg-white p-8 rounded shadow w-96 space-y-4">
        <h1 className="text-xl font-bold">UniPortal</h1>

        <form onSubmit={handleLogin} className="space-y-3">
          <input className="w-full p-2 border" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-2 border" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-primary-600 text-white py-2 rounded">Login</button>
        </form>

        <button
          onClick={handleGoogle}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
