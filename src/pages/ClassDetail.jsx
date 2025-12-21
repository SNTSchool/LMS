// src/pages/ClassDetail.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'

export default function ClassDetail() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/api/classes/${classId}`)
        setData(res)
      } catch (err) {
        // if 403/404 redirect to classes list and alert
        Swal.fire({ icon: 'error', title: 'ไม่พบหรือไม่ได้รับอนุญาต', text: 'ห้องเรียนนี้ไม่มีอยู่ในระบบหรือคุณไม่มีสิทธิ์' })
        navigate('/classes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [classId])

  if (loading) return <div>Loading...</div>
  if (!data) return null

  const { klass, assignments, sessions, files } = data

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{klass.name}</h2>
          <p className="text-sm text-slate-500">{klass.description}</p>
          <div className="text-xs mt-1">รหัสห้อง: <span className="font-mono">{klass.code}</span></div>
        </div>
      </div>

      {/* ... render assignments / sessions / files similar to earlier code ... */}
    </div>
  )
}
