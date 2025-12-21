import apiFetch from '../../api/apiFetch'

export default function CreateSession({ classId }) {
  const create = async () => {
    const res = await apiFetch(
      `/api/classes/${classId}/attendance/sessions`,
      { method: 'POST' }
    )

    window.open(res.qrUrl, '_blank')
  }

  return (
    <button
      onClick={create}
      className="px-3 py-1 bg-indigo-600 text-white rounded"
    >
      เปิดเช็คชื่อ (QR)
    </button>
  )
}
