import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  QrCode,
  ScanLine,
  LogOut,
  Shield
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'

export default function Sidebar() {
  const navigate = useNavigate()
  const { userData, loading } = useAuth()

  // ระหว่างโหลด userData ห้าม render sidebar
  if (loading) return null
  if (!userData) return null

  const role = userData.role?.toLowerCase()

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'ออกจากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#16a34a'
    })

    if (res.isConfirmed) {
      await signOut(auth)
      navigate('/login')
    }
  }

  return (
    <aside className="w-64 bg-primary-700 text-white fixed h-full p-6 hidden md:flex flex-col">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-white/10 p-2 rounded">
          <GraduationCap />
        </div>
        <div className="font-bold text-lg tracking-wide">
          UniPortal
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 text-sm">

        {/* Dashboard */}
        {role === 'student' && (
          <Link to="/" className="nav-item">
            <LayoutDashboard size={18} />
            หน้าหลักนักเรียน
          </Link>
        )}

        {role === 'instructor' && (
          <Link to="/instructor" className="nav-item">
            <LayoutDashboard size={18} />
            หน้าหลักอาจารย์
          </Link>
        )}

        {/* Classes */}
        <Link to="/classes" className="nav-item">
          <Users size={18} />
          ห้องเรียน
        </Link>

        {/* Attendance */}
        {role === 'student' && (
          <Link to="/attendance/scan" className="nav-item">
            <ScanLine size={18} />
            สแกนเช็คชื่อ
          </Link>
        )}

        {role === 'instructor' && (
          <Link to="/attendance/create" className="nav-item">
            <QrCode size={18} />
            สร้าง QR เช็คชื่อ
          </Link>
        )}

        {/* Admin */}
        {role === 'admin' && (
          <Link to="/admin" className="nav-item">
            <Shield size={18} />
            Admin Dashboard
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded bg-white/10 hover:bg-white/20 transition"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}