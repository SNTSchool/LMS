import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../routes/AuthProvider'

export default function Sidebar() {
  const { user, userData, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  const role = (userData && userData.role) ? userData.role : 'student'

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

        {['teacher','admin'].includes(role) && (
          <>
            <Link to="/create-class" className="block p-2 rounded hover:bg-green-800">Create Class</Link>
          </>
        )}
      </nav>
      <div className="mt-4">
        <div className="mb-2 text-sm truncate">{user?.email}</div>
        <div className="mb-2 text-xs">{role}</div>
        <button onClick={handleLogout} className="w-full bg-red-600 p-2 rounded">Sign out</button>
      </div>
    </aside>
  )
}
