import { Routes, Route } from 'react-router-dom'
import Classes from '../pages/Classes'
import CreateClass from '../pages/CreateClass'
import Classroom from '../pages/Classroom'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/classes" element={<Classes />} />
      <Route path="/classes/create" element={<CreateClass />} />
      <Route path="/classes/:id" element={<ClassDetail />} />
    </Routes>
  )
}
