import SubmitAssignment from '../components/assignments/SubmitAssignment'

export default function AssignmentDetail() {
  const { assignmentId } = useParams()
  const isStudent = true

  return (
    <div>
      <h2 className="text-lg font-semibold">Assignment</h2>

      {isStudent && (
        <SubmitAssignment assignmentId={assignmentId} />
      )}
    </div>
  )
}
