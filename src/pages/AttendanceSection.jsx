import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode.react'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'

export default function AttendanceSection({ classId }) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    apiFetch(`/api/classes/${classId}`).then(data => setSessions(data.sessions || [])).catch(()=>{})
  }, [classId])

  const createSession = async () => {
    try {
      const r = await apiFetch('/api/attendance_sessions', { method: 'POST', body: JSON.stringify({ classId }) })
      Swal.fire({ icon: 'success', title: 'Session created', text: r.id })
      setSessions(prev => [r, ...prev])
    } catch (err) { Swal.fire({ icon: 'error', text: err.message }) }
  }

  return (
    <section className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Attendance</h2>
        <button onClick={createSession} className="bg-green-600 text-white px-3 py-1 rounded">Create QR session</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessions.length === 0 && <div className="text-sm text-gray-500">No sessions yet</div>}
        {sessions.map(s => (
          <div key={s.id} className="p-3 border rounded text-center">
            <div className="text-xs text-gray-500 mb-2">{new Date(s.createdAt?.seconds ? s.createdAt.seconds*1000 : Date.now()).toLocaleString()}</div>
            <QRCode value={`${window.location.origin}/attendance/scan?session=${s.id}&classId=${classId}`} />
          </div>
        ))}
      </div>
    </section>
  )
}
