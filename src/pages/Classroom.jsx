import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiFetch from '../api/apiFetch'
import Sidebar from '../components/Sidebar'
import AssignmentSection from './AssignmentSection'
import AttendanceSection from './AttendanceSection'
import Swal from 'sweetalert2'

export default function Classroom() {
  const { id } = useParams()
  const [klass, setKlass] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    apiFetch(`/api/classes/${id}`).then(setKlass).catch(err => {
      Swal.fire({ icon: 'error', title: 'Not found', text: 'Class not found' })
      navigate('/classes')
    })
  }, [id])

  if (!klass) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-green-50">
      <Sidebar />
      <main className="md:ml-64 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{klass.klass.name}</h1>
            <div className="text-sm text-gray-500">Code: {klass.klass.code}</div>
          </div>
        </div>

        <AssignmentSection classId={id} />
        <AttendanceSection classId={id} />
      </main>
    </div>
  )
}
