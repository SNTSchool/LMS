import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'
import { useAuth } from '../routes/AuthProvider'

export default function AttendanceScan() {
  const [params] = useSearchParams()
  const session = params.get('session')
  const classId = params.get('classId')
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) return navigate('/login', { state: { from: { pathname: window.location.pathname + window.location.search } } })
    if (!session || !classId) {
      Swal.fire({ icon: 'error', title: 'Invalid QR' }); return
    }
    (async () => {
      try {
        await apiFetch('/api/attendance_records', { method: 'POST', body: JSON.stringify({ sessionId: session, classId }) })
        Swal.fire({ icon: 'success', title: 'Attendance recorded', timer: 1200, showConfirmButton: false })
        setTimeout(()=>navigate(`/classes/${classId}`), 1200)
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message })
      }
    })()
  }, [loading, user])

  return <div className="min-h-screen flex items-center justify-center">Processing...</div>
}
