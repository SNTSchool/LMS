import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  ClipboardList,
  Upload,
  QrCode,
  ScanLine,
  FileSpreadsheet,
  Shield,
  LogOut,
  PlusCircle
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userData, loading } = useAuth()

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

  const NavItem = ({ to, icon: Icon, label }) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-3 py-2 rounded transition
          ${active ? 'bg-primary-600' : 'hover:bg-primary-600'}
        `}
      >
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    )
  }

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

      <nav className="flex-1 space-y-1 text-sm overflow-y-auto">

        {/* ================= Dashboard ================= */}
        <NavItem
          to="/"
          icon={LayoutDashboard}
          label={
            role === 'student'
              ? 'แดชบอร์ดนักเรียน'
              : role === 'instructor'
              ? 'แดชบอร์ดอาจารย์'
              : 'แดชบอร์ด'
          }
        />

        {/* ================= Classroom ================= */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          Classroom
        </div>

        <NavItem
          to="/classes"
          icon={Users}
          label="ห้องเรียนทั้งหมด"
        />

        {(role === 'instructor' || role === 'admin') && (
          <NavItem
            to="/classes?create=true"
            icon={PlusCircle}
            label="สร้างห้องเรียน"
          />
        )}

        {/* ================= Assignments ================= */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          Assignments
        </div>

        <NavItem
          to="/assignments"
          icon={ClipboardList}
          label="งานที่มอบหมาย"
        />

        {role === 'student' && (
          <NavItem
            to="/assignments/submissions"
            icon={Upload}
            label="ส่งงานของฉัน"
          />
        )}

        {(role === 'instructor' || role === 'admin') && (
          <NavItem
            to="/assignments/manage"
            icon={ClipboardList}
            label="จัดการงาน"
          />
        )}

        {/* ================= Attendance ================= */}
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

        {/* ================= Reports ================= */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          Reports
        </div>

        <NavItem
          to="/reports"
          icon={FileSpreadsheet}
          label="รายงาน & Export"
        />

        {/* ================= Admin ================= */}
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
