import { useNavigate } from 'react-router-dom'

export default function ClassCard({ klass }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/classes/${klass.id}`)}
      className="border rounded-lg p-4 cursor-pointer hover:shadow"
    >
      <div className="font-semibold text-lg">
        {klass.name}
      </div>
      <div className="text-sm text-gray-500">
        Code: {klass.code}
      </div>
    </div>
  )
}
