import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../routes/AuthProvider'

export default function Sidebar() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const role = userData?.role

  const logout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b border-white/10">
        Learning Management System
      </div>

      <nav className="flex-1 p-4 space-y-2 text-sm">
        <Link to="/classes" className="block hover:bg-white/10 p-2 rounded">
          ห้องเรียน
        </Link>

        <Link to="/assignments" className="block hover:bg-white/10 p-2 rounded">
          งาน / Assignments
        </Link>

        {(role === 'teacher' || role === 'admin') && (
          <Link to="/reports" className="block hover:bg-white/10 p-2 rounded">
            Reports
          </Link>
        )}

        {role === 'admin' && (
          <Link to="/admin" className="block hover:bg-white/10 p-2 rounded">
            Admin
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs">
        <div className="mb-2 truncate">{user?.email}</div>
        <button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-1 rounded"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
