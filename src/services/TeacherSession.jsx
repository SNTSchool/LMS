// src/features/attendance/TeacherSession.jsx
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import { createAttendanceSession } from "../../services/attendanceService";
import { getUserProfile } from "../../services/userService";
import { useAuth } from "../../routes/AuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function TeacherSession() {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // optional: load courses collection if exists
    const loadCourses = async () => {
      try {
        const snap = await getDocs(collection(db, "courses"));
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        // ignore — courses may not exist yet
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    // set default courseId if courses available
    if (!courseId && courses.length) setCourseId(courses[0].id);
  }, [courses]);

  const handleCreate = async () => {
    if (!courseId) {
      return Swal.fire({ icon: "error", title: "กรุณาเลือกหรือกรอกรหัสวิชา" });
    }
    try {
      const profile = user ? await getUserProfile(user.uid) : null;
      const instructorId = user?.uid;
      const { sessionId, qrPayload } = await createAttendanceSession({ courseId, instructorId });
      const dataUrl = await QRCode.toDataURL(qrPayload);
      setQrDataUrl(dataUrl);
      setSessionInfo({ sessionId, courseId });
      Swal.fire({ icon: "success", title: "สร้าง session สำเร็จ", text: "QR พร้อมใช้งาน" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.message });
    }
  };

  const handleCopy = async () => {
    if (!qrDataUrl || !sessionInfo) return;
    // build link to scanner route with payload (optional)
    const link = `${window.location.origin}/attendance/scan?session=${sessionInfo.sessionId}`;
    await navigator.clipboard.writeText(link);
    Swal.fire({ icon: "success", title: "คัดลอกลิงก์แล้ว" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">สร้าง QR เช็คชื่อ (อาจารย์)</h3>
        <div className="text-sm text-slate-500">แสดงผลและสแกนได้จากมือถือ</div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <label className="block text-sm mb-2">เลือกวิชา (หรือพิมพ์รหัสวิชา)</label>
        <div className="flex gap-2">
          <select value={courseId} onChange={e => setCourseId(e.target.value)} className="p-2 border rounded flex-1">
            <option value="">-- เลือกวิชา --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
          </select>
          <input placeholder="หรือพิมพ์รหัสวิชา" value={courseId} onChange={e => setCourseId(e.target.value)} className="p-2 border rounded flex-1" />
          <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded">สร้าง QR</button>
        </div>
      </div>

      {qrDataUrl && (
        <div className="p-4 bg-white rounded shadow flex gap-6 items-center">
          <div>
            <img src={qrDataUrl} alt="attendance-qr" className="w-48 h-48 bg-white p-2" />
          </div>
          <div className="flex-1">
            <p>Session ID: <span className="font-mono">{sessionInfo.sessionId}</span></p>
            <p>วิชา: <strong>{sessionInfo.courseId}</strong></p>
            <div className="mt-4 flex gap-2">
              <button onClick={handleCopy} className="px-4 py-2 bg-primary-600 text-white rounded">คัดลอกลิงก์สแกน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
