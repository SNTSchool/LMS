// src/pages/AttendanceScan.jsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../firebaseConfig'
import Swal from 'sweetalert2'

const API = import.meta.env.VITE_API_BASE

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function AttendanceScan() {
  const q = useQuery()
  const sessionId = q.get('session')
  const classId = q.get('classId')
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const record = async () => {
      try {
        const token = await auth.currentUser.getIdToken()
        const res = await fetch(`${API}/api/attendance/record`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify({ sessionId, classId }) })
        const j = await res.json()
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'เช็คชื่อสำเร็จ' })
          setStatus('ok')
          // redirect to class detail after short delay
          setTimeout(()=> navigate(`/classes/${classId}`), 1400)
        } else {
          throw new Error(j.error || 'Failed')
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: err.message })
        setStatus('error')
      }
    }
    if (sessionId && classId) record()
  }, [sessionId, classId])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'processing' && <div>กำลังบันทึกการเข้าเรียน...</div>}
        {status === 'ok' && <div>บันทึกเรียบร้อย กำลังกลับไปยังหน้าห้องเรียน...</div>}
        {status === 'error' && <div>เกิดข้อผิดพลาด</div>}
      </div>
    </div>
  )
}
