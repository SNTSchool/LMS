import { useState } from 'react'
import { Plus } from 'lucide-react'
import JoinClassModal from './JoinClassModal'
import Swal from 'sweetalert2'
import apiFetch from '../api/apiFetch'

export default function FloatingAction({ canCreate, onCreated, onJoined }) {
  const [open, setOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const createClass = async () => {
    const { value: name } = await Swal.fire({
      title: 'สร้างห้องเรียน',
      input: 'text',
      inputLabel: 'ชื่อห้องเรียน',
      showCancelButton: true
    })

    if (!name) return

    const res = await apiFetch('/api/classes', {
      method: 'POST',
      body: JSON.stringify({ name })
    })

    Swal.fire(
      'สร้างสำเร็จ',
      `รหัสห้อง: ${res.code}`,
      'success'
    )

    onCreated({ id: res.id, name, code: res.code })
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
      >
        <Plus />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 bg-white border rounded shadow p-2 space-y-1">
          {canCreate && (
            <button
              onClick={createClass}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              ➕ สร้างห้องเรียน
            </button>
          )}
          <button
            onClick={() => setJoinOpen(true)}
            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            🔑 เข้าร่วมห้องเรียน
          </button>
        </div>
      )}

      {joinOpen && (
        <JoinClassModal
          onClose={() => setJoinOpen(false)}
          onJoined={onJoined}
        />
      )}
    </>
  )
}
