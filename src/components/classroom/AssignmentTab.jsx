import { useState } from 'react'
import { useAuth } from '../../routes/AuthProvider'
import CreateAssignmentModal from './CreateAssignmentModal'

export default function AssignmentTab({ data }) {
  const { userData } = useAuth()
  const isTeacher = ['teacher', 'admin'].includes(userData?.role)
  const [open, setOpen] = useState(false)

  return (
    <div>
      {isTeacher && (
        <button
          onClick={() => setOpen(true)}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Create Assignment
        </button>
      )}

      {data.assignments.length === 0 && (
        <div className="text-gray-400">
          ยังไม่มีงาน
        </div>
      )}

      {data.assignments.map(a => (
        <div key={a.id} className="border p-3 rounded mb-2">
          <div className="font-semibold">{a.title}</div>
          <div className="text-sm text-gray-500">
            {a.description}
          </div>
        </div>
      ))}

      {open && (
        <CreateAssignmentModal
          classId={data.klass.id}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
