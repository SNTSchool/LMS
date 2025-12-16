// src/features/classroom/ClassDetail.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClass, listAssignments, createAssignment } from '../../services/classService'
import { createAttendanceSession, closeSession } from '../../services/attendanceService'
import QRCode from 'qrcode'
import Swal from 'sweetalert2'
import { useAuth } from '../../routes/AuthProvider'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebaseConfig'

export default function ClassDetail() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { userData, user } = useAuth()
  const [klass, setKlass] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const load = async () => {
      const data = await getClass(classId)
      setKlass(data)
      const asg = await listAssignments(classId)
      setAssignments(asg)
      // load recent sessions for this class
      try {
        const q = query(collection(db, 'attendance_sessions'), where('classId', '==', classId))
        const snap = await getDocs(q)
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) { /* ignore */ }
    }
    load()
  }, [classId])

  const handleCreateAssignment = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'มอบหมายงานใหม่',
      html:
        '<input id="swal-title" class="swal2-input" placeholder="หัวข้อ">' +
        '<textarea id="swal-desc" class="swal2-textarea" placeholder="รายละเอียด"></textarea>',
      focusConfirm: false,
      preConfirm: () => {
        const title = document.getElementById('swal-title').value
        const desc = document.getElementById('swal-desc').value
        if (!title) Swal.showValidationMessage('กรุณาระบุหัวข้อ')
        return { title, desc }
      }
    })

    if (formValues) {
      await createAssignment(classId, { title: formValues.title, description: formValues.desc })
      Swal.fire({ icon: 'success', title: 'มอบหมายงานแล้ว', timer: 1000, showConfirmButton: false })
      const asg = await listAssignments(classId)
      setAssignments(asg)
    }
  }

  const handleCreateSession = async () => {
    try {
      const instructorId = user?.uid
      const { sessionId, qrPayload } = await createAttendanceSession({ classId, instructorId, durationMinutes: 15 })
      const dataUrl = await QRCode.toDataURL(qrPayload)
      setQrDataUrl(dataUrl)
      Swal.fire({ icon: 'success', title: 'สร้าง QR แล้ว', timer: 1200, showConfirmButton: false })
      // reload sessions
      const q = query(collection(db, 'attendance_sessions'), where('classId', '==', classId))
      const snap = await getDocs(q)
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: err.message })
    }
  }

  const handleCloseSession = async (sessionId) => {
    await closeSession(sessionId)
    Swal.fire({ icon: 'success', title: 'ปิด session แล้ว', timer: 1000, showConfirmButton: false })
    // refresh sessions
    const q = query(collection(db, 'attendance_sessions'), where('classId', '==', classId))
    const snap = await getDocs(q)
    setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{klass?.name || 'Class'}</h2>
          <p className="text-sm text-slate-500">{klass?.description}</p>
        </div>
        {userData?.role === 'instructor' && (
          <div className="flex gap-2">
            <button onClick={handleCreateAssignment} className="px-3 py-2 bg-primary-600 text-white rounded">มอบหมายงาน</button>
            <button onClick={handleCreateSession} className="px-3 py-2 bg-green-700 text-white rounded">สร้าง QR เช็คชื่อ</button>
          </div>
        )}
      </div>

      {/* QR display */}
      {qrDataUrl && (
        <div className="p-4 bg-white rounded shadow flex items-center gap-4">
          <img src={qrDataUrl} alt="qr" className="w-48 h-48 bg-white p-2" />
          <div>
            <p className="text-sm">สแกนเพื่อเช็คชื่อคาบนี้</p>
            <p className="text-xs text-slate-500">QR นี้จะหมดอายุอัตโนมัติ</p>
          </div>
        </div>
      )}

      {/* Assignments */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">รายการมอบหมาย</h3>
        {assignments.length === 0 && <div className="text-sm text-slate-400">ยังไม่มีงาน</div>}
        <ul className="space-y-2">
          {assignments.map(a => (
            <li key={a.id} className="p-3 border rounded">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-slate-500">{a.description}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sessions history */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">Session ที่สร้าง</h3>
        {sessions.length === 0 && <div className="text-sm text-slate-400">ยังไม่มี session</div>}
        <ul className="space-y-2">
          {sessions.map(s => (
            <li key={s.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="text-sm">Session: <span className="font-mono">{s.id}</span></div>
                <div className="text-xs text-slate-500">Active: {String(s.active)}</div>
              </div>
              {s.active ? (
                <button onClick={() => handleCloseSession(s.id)} className="px-3 py-1 bg-red-600 text-white rounded">ปิด</button>
              ) : (
                <div className="text-xs text-slate-400">ปิดแล้ว</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}