import apiFetch from '../../api/apiFetch'
import QRCode from 'qrcode.react'
import { useState } from 'react'

export default function CreateAttendanceButton({ classId }) {
  const [qr, setQr] = useState(null)

  const create = async () => {
    const res = await apiFetch('/api/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify({ classId })
    })
    setQr(res.qrUrl)
  }

  return (
    <div>
      <button
        onClick={create}
        className="bg-purple-600 text-white px-3 py-2 rounded"
      >
        Check Attendance
      </button>

      {qr && (
        <div className="mt-4">
          <QRCode value={qr} size={200} />
        </div>
      )}
    </div>
  )
}
