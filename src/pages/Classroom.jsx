import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'
import { useAuth } from '../routes/AuthProvider'

import RoleGuard from '../components/RoleGuard'

// components
import AssignmentList from '../components/assignment/AssignmentList'
import CreateAssignment from '../components/assignment/CreateAssignment'
import AttendanceSession from '../components/attendance/AttendanceSession'
import JoinClassQR from '../components/classroom/JoinClassQR'

export default function Classroom() {
  const { id } = useParams()
  const { userData } = useAuth()

  const [klass, setKlass] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [sessions, setSessions] = useState([])
  const [files, setFiles] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/api/classes/${id}`)
        setKlass(res.klass)
        setAssignments(res.assignments || [])
        setSessions(res.sessions || [])
        setFiles(res.files || [])
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'ไม่พบห้องเรียน',
          text: 'ห้องเรียนนี้ไม่มีอยู่ในระบบ'
        })
      }
    }

    load()
  }, [id])

  if (!klass) return null

  return (
    <div className="space-y-6">

      {/* ===== Header ===== */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold">{klass.name}</h1>
        <p className="text-sm text-slate-500">{klass.description}</p>

        <div className="mt-2 text-xs text-slate-400">
          รหัสห้องเรียน: <b>{klass.code}</b>
        </div>
      </div>

      {/* ===== Teacher / Admin Tools ===== */}
      <RoleGuard allow={['teacher']}>
        <div className="bg-white p-4 rounded shadow space-y-4">
          <CreateAssignment classId={klass.id} />
          <AttendanceSession classId={klass.id} />
          <JoinClassQR code={klass.code} />
        </div>
      </RoleGuard>

      {/* ===== Assignments ===== */}
      <AssignmentList
        assignments={assignments}
        classId={klass.id}
        role={userData?.role}
      />

    </div>
  )
}
