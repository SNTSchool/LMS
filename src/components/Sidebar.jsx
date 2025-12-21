import React, { useEffect, useState } from 'react'
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
  LogOut,
  ChevronRight
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, userData, loading } = useAuth()
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  /* ================= AUTH ================= */
  if (loading || !userData) return null
  const role = userData.role?.toLowerCase()

  /* ================= LOAD CLASSES ================= */
  useEffect(() => {
    const loadClasses = async () => {
      try {
        let q

        if (role === 'instructor') {
          q = query(
            collection(db, 'classes'),
            where('teacherId', '==', user.uid)
          )
        } else if (role === 'student') {
          q = query(
            collection(db, 'classes'),
            where('students', 'array-contains', user.uid)
          )
        } else {
          q = collection(db, 'classes') // admin
        }

        const snap = await getDocs(q)
        setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'โหลดห้องเรียนไม่สำเร็จ',
          text: err.message
        })
      } finally {
        setLoadingClasses(false)
      }
    }

    loadClasses()
  }, [role, user.uid])

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'ออกจากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626'
    })

    if (res.isConfirmed) {
      await signOut(auth)
      navigate('/login')
    }
  }

  /* ================= UI HELPERS ================= */
  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary-600 transition"
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  )

  /* ================= RENDER ================= */
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

        {/* ===== Dashboard ===== */}
        <NavItem
          to="/"
          icon={LayoutDashboard}
          label="Dashboard"
        />

        {/* ===== Classroom ===== */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          ห้องเรียน
        </div>

        <NavItem
          to="/classes"
          icon={Users}
          label="ห้องเรียนทั้งหมด"
        />

        {/* List classes */}
        {!loadingClasses && classes.length > 0 && (
          <div className="ml-2 space-y-1">
            {classes.map(c => (
              <Link
                key={c.id}
                to={`/classes/${c.id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-white/90 hover:bg-primary-600"
              >
                <ChevronRight size={14} />
                <span className="truncate">{c.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ===== Assignments ===== */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          งาน
        </div>
        <NavItem
          to="/assignments"
          icon={ClipboardList}
          label="งานที่มอบหมาย"
        />

        {/* ===== Attendance ===== */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          การเข้าเรียน
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

        {/* ===== Reports ===== */}
        <div className="mt-4 text-xs uppercase tracking-wide text-white/60">
          รายงาน
        </div>
        <NavItem
          to="/duty-reports"
          icon={ClipboardList}
          label="รายงานเวร"
        />
        <NavItem
          to="/reports"
          icon={FileSpreadsheet}
          label="Export / CSV"
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
          className="w-full flex items-center gap-3 px-3 py-2 rounded bg-red-600 hover:bg-red-700 transition"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
