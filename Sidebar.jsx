import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Swal from 'sweetalert2';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    });
    if (res.isConfirmed) {
      await signOut(auth);
      navigate('/login');
    }
  };

  return (
    <aside className="w-64 bg-primary-700 text-white fixed h-full p-6 hidden md:flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-white/10 p-2 rounded"><GraduationCap /></div>
        <div className="font-bold">UniPortal</div>
      </div>

      <nav className="flex-1 space-y-2">
        <Link to="/" className="flex items-center gap-3 p-3 rounded hover:bg-primary-600"><BookOpen /> ภาพรวม</Link>
        <Link to="/clubs" className="flex items-center gap-3 p-3 rounded hover:bg-primary-600"><Users /> ชุมนุม</Link>
      </nav>

      <div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded bg-white/10 hover:bg-white/20">
          <LogOut /> ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
