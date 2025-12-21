import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Shield,
  LogOut
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'

export default function Sidebar() {
  const navigate = useNavigate()
  const { userData, loading } = useAuth()

  if (loading || !userData) return null

  const role = userData.role

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'ออกจากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (res.isConfirmed) {
      await signOut(auth)
      navigate('/login')
    }
  }

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 transition"
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  )

  return (
    <aside className="w-64 bg-slate-800 text-white fixed inset-y-0 left-0 p-5 hidden md:flex flex-col">

      {/* Logo */}
      <div className="mb-8">
        <div className="text-lg font-bold">
          Learning Management System
        </div>
        <div className="text-xs text-slate-400">
          LMS Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 text-sm">

        <NavItem
          to="/classes"
          icon={Users}
          label="ห้องเรียน"
        />

        <NavItem
          to="/assignments"
          icon={ClipboardList}
          label="งานทั้งหมด"
        />

        {role === 'admin' && (
          <>
            <div className="mt-4 text-xs uppercase text-slate-400">
              Admin
            </div>
            <NavItem
              to="/admin"
              icon={Shield}
              label="Admin Panel"
            />
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
