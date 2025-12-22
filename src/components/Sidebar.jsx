import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../routes/AuthProvider'

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const logout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-white border-r p-4 space-y-4">
      <div className="font-bold text-lg">
        Learning Management System
      </div>

      <nav className="space-y-2 text-sm">
        <Link to="/classes" className="block hover:underline">
          ห้องเรียน
        </Link>

        <Link to="/assignments" className="block hover:underline">
          งาน / Assignment
        </Link>

        {/* ตอนนั้นยังมี attendance แยก */}
        <Link to="/attendance" className="block hover:underline">
          เช็คชื่อ
        </Link>
      </nav>

      <div className="pt-4 border-t text-xs">
        <div className="mb-2 text-gray-600">
          {user?.email}
        </div>

        <button
          onClick={logout}
          className="text-red-600 hover:underline"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
