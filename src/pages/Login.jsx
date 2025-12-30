import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import Swal from 'sweetalert2'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/classes'

  const loginEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate(from, { replace: true })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Login failed', text: err.message })
    }
  }

  const loginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      navigate(from, { replace: true })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Google login failed', text: err.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded shadow w-96">
        <h2 className="text-2xl font-bold mb-4">Learning Management System</h2>
        <input className="w-full p-2 border mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 border mb-4" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={loginEmail} className="w-full bg-green-600 text-white p-2 rounded mb-2">Login</button>
        <button onClick={loginGoogle} className="w-full border p-2 rounded">Sign in with Google</button>
      </div>
    </div>
  )
}
