import React, { useEffect, useState } from 'react'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'

export default function AssignmentSection({ classId }) {
  const [assignments, setAssignments] = useState([])
  useEffect(() => {
    apiFetch(`/api/classes/${classId}`).then(data => setAssignments(data.assignments || []))
  }, [classId])

  const onSubmit = async (assignmentId, fileInput) => {
    const fd = new FormData()
    fd.append('file', fileInput.files[0])
    fd.append('assignmentId', assignmentId)
    fd.append('classId', classId)
    try {
      await apiFetch(`/api/assignments/${assignmentId}/submit`, { method: 'POST', body: fd })
      Swal.fire({ icon: 'success', title: 'Submitted' })
    } catch (err) { Swal.fire({ icon: 'error', text: err.message }) }
  }

  return (
    <section className="bg-white p-4 rounded shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Assignments</h2>
      </div>

      <div className="space-y-3">
        {assignments.length === 0 && <div className="text-sm text-gray-500">No assignments</div>}
        {assignments.map(a => (
          <div key={a.id} className="p-3 border rounded">
            <div className="font-medium">{a.title}</div>
            <div className="text-xs text-gray-500 mb-2">{a.description}</div>
            <input type="file" id={`file-${a.id}`} className="mb-2" />
            <button onClick={() => onSubmit(a.id, document.getElementById(`file-${a.id}`))} className="bg-green-600 text-white px-3 py-1 rounded">Submit</button>
          </div>
        ))}
      </div>
    </section>
  )
}
