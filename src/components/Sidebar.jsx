import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../routes/AuthProvider'

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-green-900 text-white fixed left-0 top-0 bottom-0 p-6 hidden md:flex flex-col">
      <div className="mb-6 text-xl font-bold">Learning Management System</div>
      <nav className="flex-1 space-y-2">
        <Link to="/classes" className="block p-2 rounded hover:bg-green-800">Classes</Link>
        <Link to="/assignments" className="block p-2 rounded hover:bg-green-800">Assignments</Link>
        <Link to="/reports" className="block p-2 rounded hover:bg-green-800">Reports</Link>
      </nav>
      <div className="mt-4">
        <div className="mb-2 text-sm truncate">{user?.email}</div>
        <button onClick={handleLogout} className="w-full bg-red-600 p-2 rounded">Sign out</button>
      </div>
    </aside>
  )
}
