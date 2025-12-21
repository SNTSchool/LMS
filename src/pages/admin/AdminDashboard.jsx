import React, { useEffect, useState } from 'react'
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '../../firebaseConfig'
import Swal from 'sweetalert2'



export default function AdminDashboard() {
  const [users, setUsers] = useState([])

  const loadUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'โหลดข้อมูลไม่สำเร็จ',
        text: err.message
      })
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateOrUpdate = async () => {
    const { value: form } = await Swal.fire({
      title: 'สร้าง / แก้ไขผู้ใช้',
      html: `
        <input id="email" class="swal2-input" placeholder="Email">
        <select id="role" class="swal2-input">
          <option value="student">student</option>
          <option value="instructor">instructor</option>
          <option value="admin">admin</option>
        </select>
      `,
      focusConfirm: false,
      preConfirm: () => {
        
        //const uid = document.getElementById('uid').value
        const email = document.getElementById('email').value
        //const password = 'tpstudent123'
        const role = document.getElementById('role').value
        if (!uid || !email) {
          Swal.showValidationMessage('ต้องกรอก UID และ Email')
        }
        return { uid, email, role }
      }
    })

    if (!form) return

    try {
      const password = 'tpstudent123'
      createUserWithEmailAndPassword(auth, form.email, password)
      if (!userCredential) {
        Swal.fire({
          icon: 'error',
          title: 'ผิดพลาด',
          text: 'ระบบไม่สร้างบัญชี'
        })
      }
      const user = userCredential.user;
      const uid = user.uid
      await setDoc(doc(db, 'users', uid), {
        email: form.email,
        role: form.role,
        updatedAt: new Date()
      })
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1200,
        showConfirmButton: false
      })
      loadUsers()
      })
      
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: err.message
      })
    }
  }

  const handleDelete = async (uid) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'ลบผู้ใช้?',
      text: `UID: ${uid}`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (!res.isConfirmed) return

    try {
      await deleteDoc(doc(db, 'users', uid))
      await Swal.fire({
        icon: 'success',
        title: 'ลบแล้ว',
        timer: 1000,
        showConfirmButton: false
      })
      loadUsers()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ลบไม่สำเร็จ',
        text: err.message
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button
          onClick={handleCreateOrUpdate}
          className="px-4 py-2 bg-primary-600 text-white rounded"
        >
          เพิ่ม / แก้ไขผู้ใช้
        </button>
      </div>

      <div className="bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">UID</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2 font-mono text-xs">{u.id}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-600 text-xs"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-slate-400">
                  ไม่มีข้อมูลผู้ใช้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
