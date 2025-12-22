import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'

export default function Classroom() {
  const { id } = useParams()
  const [klass, setKlass] = useState(null)

  useEffect(() => {
    apiFetch(`/api/classes/${id}`).then(setKlass)
  }, [id])

  if (!klass) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{klass.klass.name}</h1>
        <div className="text-sm text-gray-500">
          รหัสห้อง: {klass.klass.code}
        </div>
      </div>

      {/* Assignments */}
      <section>
        <h2 className="font-semibold mb-2">Assignments</h2>
        {klass.assignments.map(a => (
          <div key={a.id} className="border p-3 rounded mb-2">
            {a.title}
          </div>
        ))}
      </section>

      {/* Attendance */}
      <section>
        <h2 className="font-semibold mb-2">Attendance</h2>
        {klass.sessions.map(s => (
          <div key={s.id} className="text-sm">
            {s.date}
          </div>
        ))}
      </section>
    </div>
  )
}
