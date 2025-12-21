import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { useAuth } from '../routes/AuthProvider'
import apiFetch from '../api/apiFetch'
import ClassCard from '../components/ClassCard'
import FloatingAction from '../components/FloatingAction'

export default function Classes() {
  const { userData } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/classes')
        setClasses(Array.isArray(data) ? data : [])
      } catch (err) {
        Swal.fire('โหลดห้องเรียนไม่สำเร็จ', err.message, 'error')
        setClasses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="relative p-6">
      <h1 className="text-2xl font-bold mb-4">Classes</h1>

      {classes.length === 0 && (
        <div className="text-gray-500">ยังไม่มีห้องเรียน</div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {classes.map(c => (
          <ClassCard key={c.id} klass={c} />
        ))}
      </div>

      {/* Floating + Button */}
      <FloatingAction
        canCreate={['teacher', 'admin'].includes(userData?.role)}
        onCreated={(newClass) =>
          setClasses(prev => [newClass, ...prev])
        }
        onJoined={(klass) =>
          setClasses(prev => [klass, ...prev])
        }
      />
    </div>
  )
}
