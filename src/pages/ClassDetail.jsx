// src/pages/ClassDetail.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auth } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'
import Swal from 'sweetalert2'
import QRCode from 'qrcode'

const API = import.meta.env.VITE_API_BASE

export default function ClassDetail() {
  const { classId } = useParams()
  const { userData } = useAuth()
  const [data, setData] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const navigate = useNavigate()

  const load = async () => {
    const token = await auth.currentUser.getIdToken()
    const res = await fetch(`${API}/api/classes/${classId}`, { headers: { Authorization: 'Bearer ' + token } })
    const json = await res.json()
    setData(json)
  }

  useEffect(() => { load() }, [classId])

  const handleCreateAssignment = async () => {
    const { value: form } = await Swal.fire({
      title: 'มอบหมายงาน',
      html: '<input id="t" class="swal2-input" placeholder="หัวข้อ"><textarea id="d" class="swal2-textarea" placeholder="รายละเอียด"></textarea>',
      preConfirm: () => ({ title: document.getElementById('t').value, description: document.getElementById('d').value })
    })
    if (!form || !form.title) return
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch(`${API}/api/classes/${classId}/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(form) })
      const j = await res.json()
      if (j.ok) { Swal.fire({ icon: 'success', title: 'มอบหมายแล้ว' }); load() } else throw new Error(j.error || 'Failed')
    } catch (err) { Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message }) }
  }

  const handleCreateSession = async () => {
    try {
      const { value: minutes } = await Swal.fire({ title: 'ระยะเวลา (นาที)', input: 'number', inputValue: 15 })
      if (!minutes) return
      const token = await auth.currentUser.getIdToken()
      const res = await fetch(`${API}/api/classes/${classId}/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ durationMinutes: Number(minutes) }) })
      const j = await res.json()
      if (j.ok) {
        const sessionId = j.sessionId
        // QR payload: link to attendance scan page
        const url = `${window.location.origin}/attendance/scan?session=${sessionId}&classId=${classId}`
        const dataUrl = await QRCode.toDataURL(url)
        setQrDataUrl(dataUrl)
        Swal.fire({ icon: 'success', title: 'สร้าง session แล้ว', timer: 1200 })
        load()
      } else throw new Error(j.error || 'Failed')
    } catch (err) { Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message }) }
  }

  const handleExportCSV = async () => {
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch(`${API}/api/classes/${classId}/export?type=csv`, { headers: { Authorization: 'Bearer ' + token } })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Export failed') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${classId}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) { Swal.fire({ icon: 'error', text: err.message }) }
  }

  if (!data) return <div>Loading...</div>

  const { klass, assignments, sessions, files } = data

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{klass.name}</h2>
          <p className="text-sm text-slate-500">{klass.description}</p>
        </div>
        <div className="text-xs text-slate-400">Class ID: <span className="font-mono">{klass.id}</span></div>
      </div>

      <div className="flex gap-3">
        {userData?.role === 'instructor' && <button onClick={handleCreateAssignment} className="px-3 py-2 bg-primary-600 text-white rounded">มอบหมายงาน</button>}
        {userData?.role === 'instructor' && <button onClick={handleCreateSession} className="px-3 py-2 bg-green-600 text-white rounded">สร้าง QR เช็คชื่อ</button>}
        {(userData?.role === 'instructor' || userData?.role === 'admin') && <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-700 text-white rounded">Export CSV</button>}
      </div>

      {qrDataUrl && (
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center gap-4">
            <img src={qrDataUrl} alt="QR Session" className="w-40 h-40" />
            <div>
              <div className="font-medium">QR สำหรับสแกนเช็คชื่อ</div>
              <div className="text-sm text-slate-500">QR นี้จะใช้ได้ตามเวลาที่กำหนด</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-bold mb-2">งานมอบหมาย</h3>
            {assignments.length === 0 ? <div className="text-slate-400">ยังไม่มีงาน</div> : assignments.map(a => (
              <div key={a.id} className="p-3 border rounded mb-2">
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-slate-500">{a.description}</div>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">ไฟล์ในห้อง</h3>
            {files.length === 0 ? <div className="text-slate-400">ยังไม่มีไฟล์</div> : files.map(f => (
              <div key={f.id} className="flex justify-between items-center">
                <a href={f.url} target="_blank" rel="noreferrer" className="text-primary-600 underline">{f.name}</a>
                <div className="text-xs text-slate-400">{f.ownerEmail}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-bold mb-2">Session (QR)</h3>
            {sessions.length === 0 ? <div className="text-slate-400">ยังไม่มี session</div> : sessions.map(s => (
              <div key={s.id} className="p-3 border rounded mb-2 flex justify-between items-center">
                <div>
                  <div className="font-medium">Session: <span className="font-mono">{s.id}</span></div>
                  <div className="text-xs text-slate-400">Active: {String(s.active)} • Expires: {s.expiresAt ? new Date(s.expiresAt._seconds * 1000).toLocaleString() : '-'}</div>
                </div>
                <div>
                  {userData?.role === 'instructor' && s.active && <button onClick={async ()=>{ const t = await auth.currentUser.getIdToken(); await fetch(`${API}/api/sessions/${s.id}/close`, { method:'POST', headers: { Authorization: 'Bearer '+t } }); Swal.fire({icon:'success', title:'ปิดแล้ว'}); load() }} className="px-2 py-1 bg-red-600 text-white rounded text-xs">ปิด</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
