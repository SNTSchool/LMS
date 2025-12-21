// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ClassesPage from '../pages/Classes'
import ClassDetail from '../pages/ClassDetail'
import AttendanceScan from '../pages/AttendanceScan'

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/attendance/scan"
        element={<AttendanceScan />}
      />

      <Route
        path="/*"
        element={
          <AppLayout>
            <Routes>
              <Route path="classes" element={<ClassesPage />} />
              <Route path="classes/:classId" element={<ClassDetail />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  )
}
