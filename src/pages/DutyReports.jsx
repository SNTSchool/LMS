// src/pages/DutyReports.jsx
import React, { useEffect, useState } from 'react';
import { fileDutyReport, listDutyReports } from '../services/dutyService';
import { useAuth } from '../routes/AuthProvider';
import Swal from 'sweetalert2';
import { exportToCsv } from '../utils/exportUtil';

export default function DutyReportsPage() {
  const { user, userData } = useAuth();
  const [reports, setReports] = useState([]);

  const load = async () => {
    const all = await listDutyReports();
    setReports(all);
  };

  useEffect(() => { load(); }, []);

  const handleFile = async () => {
    const { value: form } = await Swal.fire({
      title: 'รายงานเวร',
      html:
        '<input id="date" type="date" class="swal2-input">' +
        '<textarea id="desc" class="swal2-textarea" placeholder="รายละเอียด"></textarea>' +
        '<input id="hours" type="number" class="swal2-input" placeholder="ชั่วโมง (ตัวเลข)"/>',
      preConfirm: () => {
        return {
          date: document.getElementById('date').value,
          description: document.getElementById('desc').value,
          hours: Number(document.getElementById('hours').value || 0)
        };
      }
    });
    if (form) {
      await fileDutyReport({ userId: user.uid, ...form });
      Swal.fire('บันทึกแล้ว', '', 'success');
      load();
    }
  };

  const handleExportCsv = () => {
    exportToCsv('duty_reports.csv', reports);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">รายงานเวร</h2>
        <div className="flex gap-2">
          <button onClick={handleFile} className="px-3 py-2 bg-primary-600 text-white rounded">บันทึกเวร</button>
          <button onClick={handleExportCsv} className="px-3 py-2 border rounded">Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-sm">
          <thead><tr><th>UID</th><th>วันที่</th><th>รายละเอียด</th><th>ชม.</th><th>สถานะ</th></tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td className="p-2 font-mono">{r.userId}</td>
                <td className="p-2">{r.date}</td>
                <td className="p-2">{r.description}</td>
                <td className="p-2">{r.hours}</td>
                <td className="p-2">{r.approved ? 'อนุมัติ' : 'รออนุมัติ'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}