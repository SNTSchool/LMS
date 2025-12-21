import AttendanceQR from './AttendanceQR'
import { useAuth } from '../../routes/AuthProvider'

export default function StreamTab({ data }) {
  const { userData } = useAuth()
  const isTeacher = ['teacher', 'admin'].includes(userData?.role)

  return (
    <div className="space-y-4">
      {isTeacher && (
        <AttendanceQR classId={data.klass.id} />
      )}

      <div className="text-gray-400">
        ยังไม่มีประกาศ
      </div>
    </div>
  )
}
