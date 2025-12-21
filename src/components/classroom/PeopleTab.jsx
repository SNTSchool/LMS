export default function PeopleTab({ data }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold mb-2">Teachers</h3>
        {data.klass.teacherIds.map(t => (
          <div key={t} className="text-sm">
            {t}
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Students</h3>
        {data.klass.members.map(m => (
          <div key={m} className="text-sm">
            {m}
          </div>
        ))}
      </div>
    </div>
  )
}
