import React from 'react';

export default function InstructorDashboard(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">แดชบอร์ดอาจารย์</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">ภาระงาน</div>
        <div className="p-4 bg-white rounded shadow">รายงานเวร</div>
      </div>
    </div>
  )
}
