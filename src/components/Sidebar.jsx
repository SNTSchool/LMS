import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  Users,
  LogOut,
  QrCode,
  ScanLine,
  LayoutDashboard
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'

export default function Sidebar() {
  const navigate = useNavigate()
  const { userData } = useAuth() // ต้องมี role อยู่ในนี้

  const role = userData?.role

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
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

      {/* Header */}
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
          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded hover:bg-primary-600 transition"
          >
            <LayoutDashboard size={18} />
            ภาพรวมการเรียน
          </Link>
        )}

        {role === 'instructor' && (
          <Link
            to="/instructor"
            className="flex items-center gap-3 p-3 rounded hover:bg-primary-600 transition"
          >
            <LayoutDashboard size={18} />
            แดชบอร์ดอาจารย์
          </Link>
        )}

        {/* Attendance */}
        {role === 'student' && (
          <Link
            to="/attendance/scan"
            className="flex items-center gap-3 p-3 rounded hover:bg-primary-600 transition"
          >
            <ScanLine size={18} />
            สแกนเช็คชื่อ
          </Link>
        )}

        {role === 'instructor' && (
          <Link
            to="/attendance/create"
            className="flex items-center gap-3 p-3 rounded hover:bg-primary-600 transition"
          >
            <QrCode size={18} />
            สร้าง QR เช็คชื่อ
          </Link>
        )}

        {/* Clubs */}
        <Link
          to="/clubs"
          className="flex items-center gap-3 p-3 rounded hover:bg-primary-600 transition"
        >
          <Users size={18} />
          ชุมนุม
        </Link>

      </nav>

      {/* Footer */}
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
