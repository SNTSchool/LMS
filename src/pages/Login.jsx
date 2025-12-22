import React from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'

export default function Login() {
  const login = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>
      <button onClick={login}>Login with Google</button>
    </div>
  )
}
