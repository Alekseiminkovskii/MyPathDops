import { useParams, useNavigate } from 'react-router-dom'
import { JSAForm } from '../components/JSAForm'

const S = 20

export function JSAPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', padding: `40px ${S}px`, textAlign: 'left' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <button onClick={() => navigate(`/jobs/${id}`)} style={{ background: 'none', border: 'none',
          color: '#888', fontSize: 14, cursor: 'pointer', padding: '0 0 24px',
          display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Job
        </button>

        <JSAForm jobId={Number(id)} />

      </div>
    </div>
  )
}
