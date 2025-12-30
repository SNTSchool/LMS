import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import apiFetch from '../api/apiFetch'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'
import QRCode from 'react-qr-code'

export default function Classroom() {
  const { id } = useParams()
  const { user, userData } = useAuth()

  const [klass, setKlass] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // create assignment form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const isAdmin = userData?.role === 'admin'
  const isTeacher =
    isAdmin || (klass?.teacherIds || []).includes(user?.uid)

  /* -------------------------------------------------- */
  /* Load classroom                                     */
  /* -------------------------------------------------- */
  useEffect(() => {
    loadClassroom()
    // eslint-disable-next-line
  }, [id])

  const loadClassroom = async () => {
    try {
      setLoading(true)
      const res = await apiFetch(`/api/classes/${id}`)
      setKlass(res.klass)
      setAssignments(res.assignments || [])
      setSessions(res.sessions || [])
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  /* -------------------------------------------------- */
  /* Assignment                                         */
  /* -------------------------------------------------- */
  const createAssignment = async () => {
    if (!title) {
      Swal.fire('กรุณาระบุชื่องาน')
      return
    }

    try {
      await apiFetch(`/api/classes/${id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ title, description })
      })

      setTitle('')
      setDescription('')
      loadClassroom()
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  const submitAssignment = async (assignmentId, file) => {
    if (!file) return

    const form = new FormData()
    form.append('file', file)
    form.append('classId', id)

    try {
      await apiFetch(
        `/api/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          body: form
        },
        true // multipart
      )

      Swal.fire('ส่งงานเรียบร้อย', '', 'success')
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  /* -------------------------------------------------- */
  /* Attendance                                         */
  /* -------------------------------------------------- */
  const createAttendanceSession = async () => {
    try {
      await apiFetch('/api/attendance_sessions', {
        method: 'POST',
        body: JSON.stringify({ classId: id })
      })
      loadClassroom()
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  const joinAttendance = async (sessionId) => {
    try {
      await apiFetch('/api/attendance_records', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          classId: id
        })
      })
      Swal.fire('เช็คชื่อเรียบร้อย', '', 'success')
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  /* -------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!klass) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold">{klass.name}</h1>
        <p className="text-gray-500">
          Class Code: <b>{klass.code}</b>
        </p>
      </div>

      {/* ---------- Assignment Section ---------- */}
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">Assignments</h2>

        {isTeacher && (
          <div className="border p-3 rounded space-y-2">
            <input
              className="w-full border p-2"
              placeholder="ชื่องาน"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="w-full border p-2"
              placeholder="คำอธิบาย"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <button
              onClick={createAssignment}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              มอบหมายงาน
            </button>
          </div>
        )}

        {assignments.map(a => (
          <div
            key={a.id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm text-gray-500">
                {a.description}
              </div>
            </div>

            {!isTeacher && (
              <input
                type="file"
                onChange={e =>
                  submitAssignment(a.id, e.target.files[0])
                }
              />
            )}
          </div>
        ))}
      </div>

      {/* ---------- Attendance Section ---------- */}
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">Attendance</h2>

        {isTeacher && (
          <button
            onClick={createAttendanceSession}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            เปิดเช็คชื่อ (QR)
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map(s => {
            const url = `${window.location.origin}/attendance/scan?session=${s.id}&classId=${id}`

            return (
              <div key={s.id} className="border p-3 rounded">
                <div className="text-sm text-gray-500 mb-2">
                  Session: {s.id}
                </div>

                <QRCode value={url} size={160} />

                {!isTeacher && (
                  <button
                    onClick={() => joinAttendance(s.id)}
                    className="mt-3 bg-green-600 text-white px-3 py-1 rounded"
                  >
                    เช็คชื่อ
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
