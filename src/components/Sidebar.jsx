// src/components/Sidebar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../routes/AuthProvider'

export default function Sidebar() {
  const { user, userData, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return null
  if (!user) return null

  const role = userData?.role

  const logout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h2 className="text-lg font-bold mb-4">
        Learning Management System
      </h2>

      <nav className="space-y-2">
        <Link to="/classes" className="block hover:bg-gray-700 p-2 rounded">
          ห้องเรียน
        </Link>

        {(role === 'teacher' || role === 'admin') && (
          <Link to="/classes/create" className="block hover:bg-gray-700 p-2 rounded">
            สร้างห้องเรียน
          </Link>
        )}

        <button
          onClick={logout}
          className="w-full text-left hover:bg-red-700 p-2 rounded mt-6"
        >
          ออกจากระบบ
        </button>
      </nav>
    </aside>
  )
}