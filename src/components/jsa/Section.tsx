import { useState } from 'react'

const S = 20

interface Props {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function Section({ title, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        padding: `16px ${S}px`, cursor: 'pointer', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
        <span style={{ fontSize: 13, color: '#888' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: `0 ${S}px ${S}px` }}>
          {children}
        </div>
      )}
    </div>
  )
}
