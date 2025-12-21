// src/components/attendance/AttendanceSessionPanel.jsx
export default function AttendanceSessionPanel({ onCreate }) {
  return (
    <div className="border rounded p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">เช็คชื่อประจำคาบ</h3>
      <button
        onClick={onCreate}
        className="px-3 py-2 bg-blue-600 text-white rounded"
      >
        สร้าง QR เช็คชื่อ
      </button>
    </div>
  )
}
