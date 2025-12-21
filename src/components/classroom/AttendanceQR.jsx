import QRCode from 'react-qr-code'
import apiFetch from '../../api/apiFetch'
import { useState } from 'react'
import Swal from 'sweetalert2'

export default function AttendanceQR({ classId }) {
  const [session, setSession] = useState(null)

  const startSession = async () => {
    const res = await apiFetch('/api/attendance/session', {
      method: 'POST',
      body: JSON.stringify({ classId })
    })
    setSession(res)
    Swal.fire('เปิดเช็คชื่อแล้ว', '', 'success')
  }

  return (
    <div className="border p-4 rounded">
      {!session ? (
        <button
          onClick={startSession}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          เปิด QR เช็คชื่อ
        </button>
      ) : (
        <>
          <div className="mb-2 font-semibold">
            QR สำหรับคาบนี้
          </div>
          <QRCode
            value={`${location.origin}/attendance/scan/${session.id}`}
          />
        </>
      )}
    </div>
  )
}
