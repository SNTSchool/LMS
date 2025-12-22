import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Classes from './pages/Classes'
import Classroom from './pages/Classroom'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <Classes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes/:id"
        element={
          <ProtectedRoute>
            <Classroom />
          </ProtectedRoute>
        }
      />

      {/* ❌ อย่า redirect มั่ว */}
      {/* ถ้า path ไม่มีจริง ค่อยโชว์ 404 page ภายหลัง */}
    </Routes>
  )
}
