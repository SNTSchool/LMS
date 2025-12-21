import apiFetch from '../../api/apiFetch'

export default function AttendanceSessionPanel({ sessionId, onClose }) {
  const close = async () => {
    await apiFetch(`/api/attendance/sessions/${sessionId}/close`, {
      method: 'POST'
    })
    alert('Session closed')
    onClose?.()
  }

  const exportCsv = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/api/attendance/sessions/${sessionId}/export`,
      '_blank'
    )
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={close}
        className="bg-red-600 text-white px-3 py-1 rounded"
      >
        Close Session
      </button>

      <button
        onClick={exportCsv}
        className="bg-slate-600 text-white px-3 py-1 rounded"
      >
        Export CSV
      </button>
    </div>
  )
}
