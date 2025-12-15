import React from 'react';

export default function StudentDashboard(){
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">สวัสดี, นักศึกษา</h2>
          <p className="text-sm text-slate-500">ภาพรวมระบบ</p>
        </div>
        <div className="bg-white p-3 rounded shadow text-green-700">GPA: 3.55</div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">ห้องเรียนออนไลน์</div>
        <div className="p-4 bg-white rounded shadow">ตารางเรียน</div>
        <div className="p-4 bg-white rounded shadow">คะแนนความประพฤติ</div>
      </div>
    </div>
  )
}
