import { useEffect, useState } from 'react'
import { useAuth } from '../routes/AuthProvider'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

export default function Classes() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    apiFetch('/api/classes').then(setClasses)
  }, [user])

  const openAction = async () => {
    const res = await Swal.fire({
      title: 'เลือกการทำงาน',
      showDenyButton: true,
      confirmButtonText: 'สร้างห้องเรียน',
      denyButtonText: 'เข้าร่วมด้วยรหัส'
    })

    if (res.isConfirmed) {
      navigate('/classes/create')
    } else if (res.isDenied) {
      const { value } = await Swal.fire({
        title: 'รหัสห้องเรียน',
        input: 'text'
      })
      if (value) {
        const r = await apiFetch('/api/classes/join', {
          method: 'POST',
          body: JSON.stringify({ code: value })
        })
        navigate(`/classes/${r.classId}`)
      }
    }
  }

  return (
    <div className="relative">
      <h1 className="text-xl font-bold mb-4">ห้องเรียน</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classes.map(c => (
          <div
            key={c.id}
            onClick={() => navigate(`/classes/${c.id}`)}
            className="p-4 border rounded cursor-pointer hover:bg-slate-50"
          >
            <div className="font-semibold">{c.name}</div>
            <div className="text-xs text-gray-500">{c.code}</div>
          </div>
        ))}
      </div>

      <button
        onClick={openAction}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 text-white text-3xl"
      >
        +
      </button>
    </div>
  )
}
