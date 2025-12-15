import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1200, showConfirmButton: false });
      navigate('/');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบด้วย Google', timer: 1000, showConfirmButton: false });
      navigate('/');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">UniPortal</h1>
        <p className="text-sm text-slate-500 mb-6">ระบบบริหารจัดการเรียนการสอน — Demo Starter</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="อีเมล" className="w-full p-3 border rounded" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="รหัสผ่าน" className="w-full p-3 border rounded" />
          <button disabled={loading} className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-4 flex gap-2">
          <button onClick={handleGoogle} className="flex-1 py-2 border rounded text-sm">Sign in with Google</button>
        </div>

        <div className="text-xs text-slate-400 mt-4">
          ตัวอย่าง: สร้างบัญชีใน Firebase Auth เพื่อทดลอง (Email/Password)
        </div>
      </div>
    </div>
  );
}
