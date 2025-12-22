import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const location = useLocation()
const navigate = useNavigate()
const from = location.state?.from?.pathname || '/classes'


export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const loginEmail = async () => {
   await signInWithEmailAndPassword(auth, email, password)
navigate(from, { replace: true })

  }

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider()
   await signInWithPopup(auth, googleProvider)
navigate(from, { replace: true })

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded w-80 space-y-3">
        <h2 className="font-bold text-lg">Login</h2>

        <input
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-2"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={loginEmail} className="w-full bg-blue-600 text-white p-2">
          Login
        </button>

        <button onClick={loginGoogle} className="w-full border p-2">
          Login with Google
        </button>
      </div>
    </div>
  )
}
