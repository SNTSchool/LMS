import { useState } from 'react'
import StreamTab from './StreamTab'
import AssignmentTab from './AssignmentTab'
import PeopleTab from './PeopleTab'

export default function ClassroomTabs({ data }) {
  const [tab, setTab] = useState('stream')

  return (
    <>
      <div className="flex gap-6 border-b mb-4">
        {['stream', 'classwork', 'people'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 ${
              tab === t
                ? 'border-b-2 border-blue-600 font-semibold'
                : 'text-gray-500'
            }`}
          >
            {t === 'stream'
              ? 'Stream'
              : t === 'classwork'
              ? 'Classwork'
              : 'People'}
          </button>
        ))}
      </div>

      {tab === 'stream' && <StreamTab data={data} />}
      {tab === 'classwork' && <AssignmentTab data={data} />}
      {tab === 'people' && <PeopleTab data={data} />}
    </>
  )
}
