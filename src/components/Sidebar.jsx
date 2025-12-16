import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  ClipboardList,
  QrCode,
  ScanLine,
  FileSpreadsheet,
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

  // ระหว่างโหลด auth / role → ไม่ render sidebar
  if (loading || !userData) return null

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

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary-600 transition"
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  )

  return (
    <aside className="w-64 bg-primary-700 text-white fixed inset-y-0 left-0 p-5 hidden md:flex flex-col">

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

        {/* ===== Dashboard ===== */}
        {role === 'student' && (
          <NavItem
            to="/"
            icon={LayoutDashboard}
            label="แดชบอร์ดนักเรียน"
          />
        )}

        {role === 'instructor' && (
          <NavItem
            to="/instructor"
            icon={LayoutDashboard}
            label="แดชบอร์ดอาจารย์"
          />
        )}

        {/* ===== Classroom ===== */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          Classroom
        </div>

        <NavItem
          to="/classes"
          icon={Users}
          label="ห้องเรียน"
        />

        {/* ===== Assignment ===== */}
        <NavItem
          to="/assignments"
          icon={ClipboardList}
          label="งานที่มอบหมาย"
        />

        {/* ===== Attendance ===== */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          Attendance
        </div>

        {role === 'student' && (
          <NavItem
            to="/attendance/scan"
            icon={ScanLine}
            label="สแกนเช็คชื่อ"
          />
        )}

        {(role === 'instructor' || role === 'admin') && (
          <NavItem
            to="/attendance/create"
            icon={QrCode}
            label="สร้าง QR เช็คชื่อ"
          />
        )}

        {/* ===== Duty / Reports ===== */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          Reports
        </div>

        <NavItem
          to="/duty-reports"
          icon={ClipboardList}
          label="รายงานเวร"
        />

        <NavItem
          to="/reports"
          icon={FileSpreadsheet}
          label="รายงาน & Export"
        />

        {/* ===== Admin ===== */}
        {role === 'admin' && (
          <>
            <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
              Admin
            </div>
            <NavItem
              to="/admin"
              icon={Shield}
              label="Admin Dashboard"
            />
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}