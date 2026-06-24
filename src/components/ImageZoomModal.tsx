import { useRef, useState } from 'react'

interface Props {
  src: string
  alt?: string
  onClose: () => void
}

const MIN_SCALE = 1
const MAX_SCALE = 4

export function ImageZoomModal({ src, alt, onClose }: Props) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ x: number; y: number; startOffset: { x: number; y: number } } | null>(null)

  function clampScale(s: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const next = clampScale(scale - e.deltaY * 0.0015 * scale)
    setScale(next)
    if (next === 1) setOffset({ x: 0, y: 0 })
  }

  function handleDoubleClick() {
    if (scale > 1) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (scale === 1) return
    dragRef.current = { x: e.clientX, y: e.clientY, startOffset: offset }
    setIsDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    setOffset({ x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy })
  }

  function handlePointerUp() {
    dragRef.current = null
    setIsDragging(false)
  }

  return (
    <div onClick={onClose} onWheel={handleWheel} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, cursor: scale > 1 ? 'grab' : 'zoom-in', overflow: 'hidden' }}>
      <img src={src} alt={alt}
        onClick={e => e.stopPropagation()}
        onDoubleClick={e => { e.stopPropagation(); handleDoubleClick() }}
        onPointerDown={e => { e.stopPropagation(); handlePointerDown(e) }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        draggable={false}
        style={{
          maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          cursor: scale > 1 ? 'grab' : 'zoom-in', touchAction: 'none',
        }} />
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 20, width: 36, height: 36,
        borderRadius: 18, border: 'none', backgroundColor: 'rgba(255,255,255,0.15)',
        color: '#fff', fontSize: 18, cursor: 'pointer' }}>
        ×
      </button>
      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0,
        textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
        Scroll to zoom · double-click to {scale > 1 ? 'reset' : 'zoom'} · drag to pan
      </div>
    </div>
  )
}
