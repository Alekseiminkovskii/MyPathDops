import { useRef, useState } from 'react'
import { SignaturePad, type SignaturePadHandle } from './SignaturePad'

interface Props {
  name: string
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export function SignatureModal({ name, onSave, onClose }: Props) {
  const handleRef = useRef<SignaturePadHandle | null>(null)
  const [empty, setEmpty] = useState(true)

  function handleSave() {
    if (!handleRef.current || handleRef.current.isEmpty()) return
    onSave(handleRef.current.toDataURL())
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: 12, padding: 24,
        width: 'min(440px, calc(100vw - 32px))', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
          Sign — {name || 'Crew Member'}
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#888' }}>
          Draw your signature below.
        </p>

        <SignaturePad
          onReady={h => { handleRef.current = h; setEmpty(h.isEmpty()) }}
          onDraw={() => setEmpty(false)} />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => { handleRef.current?.clear(); setEmpty(true) }} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0',
            backgroundColor: '#fff', color: '#666', fontSize: 13, cursor: 'pointer' }}>
            Clear
          </button>
          <button onClick={onClose} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0',
            backgroundColor: '#fff', color: '#c62828', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave}
            disabled={empty} style={{
            flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none',
            backgroundColor: empty ? '#ccc' : '#2e7d32', color: '#fff', fontSize: 13,
            fontWeight: 500, cursor: empty ? 'not-allowed' : 'pointer' }}>
            Save Signature
          </button>
        </div>
      </div>
    </div>
  )
}
