import { useEffect, useState } from 'react'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'

const API_URL = import.meta.env.VITE_API_URL

export default function Classes() {
  const { user, loading } = useAuth()
  const [classes, setClasses] = useState([])

  useEffect(() => {
    if (loading || !user) return   // ⭐ สำคัญมาก

    const load = async () => {
      try {
        const token = await user.getIdToken()

        const res = await fetch(`${API_URL}/api/classes`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await res.json()

        // ⭐ จุดแก้ e.map is not a function
        if (!Array.isArray(data)) {
          console.error('API returned:', data)
          setClasses([])
          return
        }

        setClasses(data)
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'โหลดห้องเรียนไม่สำเร็จ',
          text: err.message
        })
        setClasses([])
      }
    }

    load()
  }, [user, loading])

  return (
    <div className="space-y-4">
      {classes.map(c => (
        <div key={c.id} className="p-4 border rounded">
          <div className="font-semibold">{c.name}</div>
          <div className="text-xs text-slate-500">{c.code}</div>
        </div>
      ))}

      {classes.length === 0 && (
        <div className="text-slate-400 text-sm">
          ยังไม่มีห้องเรียน
        </div>
      )}
    </div>
  )
}
