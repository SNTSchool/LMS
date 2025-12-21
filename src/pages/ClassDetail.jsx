import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import apiFetch from '../api/apiFetch'
import ClassroomTabs from '../components/classroom/ClassroomTabs'

export default function ClassDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/api/classes/${id}`)
        setData(res)
      } catch (err) {
        Swal.fire(
          'ไม่พบห้องเรียน',
          'ห้องเรียนนี้ไม่มีอยู่ในระบบ',
          'error'
        )
        navigate('/classes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!data) return null

  return (
    <div className="p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">
          {data.klass.name}
        </h1>
        <div className="text-sm text-gray-500">
          Class code: {data.klass.code}
        </div>
      </div>

      <ClassroomTabs data={data} />
    </div>
  )
}


<CreateAttendanceButton classId={classId} />

{currentSessionId && (
  <>
    <AttendanceList sessionId={currentSessionId} />
    <AttendanceSessionPanel sessionId={currentSessionId} />
  </>
)}

