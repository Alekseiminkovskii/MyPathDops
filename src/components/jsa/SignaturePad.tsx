import { useEffect, useRef } from 'react'

export interface SignaturePadHandle {
  toDataURL: () => string
  clear: () => void
  isEmpty: () => boolean
}

interface Props {
  onReady?: (handle: SignaturePadHandle) => void
  onDraw?: () => void
}

const WIDTH = 400
const HEIGHT = 160

export function SignaturePad({ onReady, onDraw }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const hasDrawnRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    function pos(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function down(e: PointerEvent) {
      drawingRef.current = true
      const { x, y } = pos(e)
      ctx!.beginPath()
      ctx!.moveTo(x, y)
    }
    function move(e: PointerEvent) {
      if (!drawingRef.current) return
      const { x, y } = pos(e)
      ctx!.lineTo(x, y)
      ctx!.stroke()
      hasDrawnRef.current = true
      onDraw?.()
    }
    function up() { drawingRef.current = false }

    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointerleave', up)

    onReady?.({
      toDataURL: () => canvas.toDataURL('image/png'),
      clear: () => {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, WIDTH, HEIGHT)
        hasDrawnRef.current = false
      },
      isEmpty: () => !hasDrawnRef.current,
    })

    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointerleave', up)
    }
  }, [onReady, onDraw])

  return (
    <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{
      width: '100%', maxWidth: WIDTH, height: HEIGHT, touchAction: 'none',
      border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'crosshair',
    }} />
  )
}
