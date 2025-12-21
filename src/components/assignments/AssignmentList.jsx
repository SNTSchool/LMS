import { useEffect, useState } from 'react'
import apiFetch from '../../api/apiFetch'

export default function AssignmentList({ classId }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    apiFetch(`/api/classes/${classId}/assignments`)
      .then(setItems)
  }, [classId])

  return (
    <div className="space-y-3">
      {items.map(a => (
        <div key={a.id} className="border p-3 rounded">
          <div className="font-semibold">{a.title}</div>
          <div className="text-sm text-slate-600">{a.description}</div>
        </div>
      ))}
    </div>
  )
}
