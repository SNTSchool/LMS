import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import apiFetch from '../api/apiFetch'

export default function AttendanceScan() {
  const { sessionId } = useParams()

  useEffect(() => {
    apiFetch(`/api/attendance/scan/${sessionId}`, {
      method: 'POST'
    })
      .then(() => alert('Attendance recorded'))
      .catch(err => alert(err.message))
  }, [sessionId])

  return <p>Checking attendance...</p>
}
