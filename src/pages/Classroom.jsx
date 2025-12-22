import { useParams } from 'react-router-dom'

export default function Classroom() {
  const { id } = useParams()

  useEffect(() => {
    fetch(`/api/classes/${id}`)
      .then(res => res.json())
      .then(data => console.log(data))
  }, [id])

  return <div>Classroom {id}</div>
}
