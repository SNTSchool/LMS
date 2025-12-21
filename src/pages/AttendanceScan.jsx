import { useSearchParams } from 'react-router-dom'
import apiFetch from '../api/apiFetch'

export default function AttendanceScan() {
  const [params] = useSearchParams()
  const sessionId = params.get('session')

  const scan = async () => {
    await apiFetch('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    })
    alert('เช็คชื่อเรียบร้อย')
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={scan}
        className="px-6 py-3 bg-green-600 text-white rounded text-lg"
      >
        เช็คชื่อเข้าเรียน
      </button>
    </div>
  )
}
