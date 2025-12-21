import { useEffect, useState } from 'react'
import apiFetch from '../../api/apiFetch'

export default function AttendanceList({ sessionId }) {
  const [list, setList] = useState([])

  useEffect(() => {
    apiFetch(`/api/attendance/sessions/${sessionId}`)
      .then(setList)
  }, [sessionId])

  return (
    <ul>
      {list.map(r => (
        <li key={r.uid}>
          {r.displayName} ({r.email})
        </li>
      ))}
    </ul>
  )
}
