import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const HAZARDS = [
  'Working at heights / Tower climbing',
  'Electrical hazards',
  'Heavy lifting / Manual handling',
  'Traffic / Vehicle hazards',
  'Adverse weather conditions',
  'Falling objects / Dropped tools',
  'RF / EMF exposure',
  'Hand and power tools',
  'Confined spaces',
  'Slippery or unstable surfaces',
]

interface JSA {
  id: number
  job_id: number
  hazards: string[]
  notes: string
  signatures: string[]
  completed_at: string | null
}

interface Props {
  jobId: number
}

const S = 20

export function JSAForm({ jobId }: Props) {
  const [jsa, setJsa] = useState<JSA | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [selectedHazards, setSelectedHazards] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [signatures, setSignatures] = useState<string[]>([''])

  useEffect(() => {
    async function fetchJSA() {
      const { data } = await supabase
        .from('jsa')
        .select('*')
        .eq('job_id', jobId)
        .maybeSingle()
      if (data) {
        setJsa(data as JSA)
        setSelectedHazards(data.hazards || [])
        setNotes(data.notes || '')
        setSignatures(data.signatures?.length ? data.signatures : [''])
      }
      setLoading(false)
    }
    fetchJSA()
  }, [jobId])

  function toggleHazard(hazard: string) {
    setSelectedHazards(prev =>
      prev.includes(hazard)
        ? prev.filter(h => h !== hazard)
        : [...prev, hazard]
    )
  }

  function updateSignature(index: number, value: string) {
    const updated = [...signatures]
    updated[index] = value
    setSignatures(updated)
  }

  function addSignature() {
    setSignatures([...signatures, ''])
  }

  function removeSignature(index: number) {
    setSignatures(signatures.filter((_, i) => i !== index))
  }

  async function handleComplete() {
    if (selectedHazards.length === 0) {
      alert('Select at least one hazard before completing the JSA.')
      return
    }
    const validSigs = signatures.filter(s => s.trim())
    if (validSigs.length === 0) {
      alert('At least one crew member signature is required.')
      return
    }

    setSaving(true)
    const payload = {
      job_id: jobId,
      hazards: selectedHazards,
      notes,
      signatures: validSigs,
      completed_at: new Date().toISOString(),
    }

    const { data, error } = jsa
      ? await supabase.from('jsa').update(payload).eq('id', jsa.id).select().single()
      : await supabase.from('jsa').insert([payload]).select().single()

    if (error) console.error(error)
    else setJsa(data as JSA)
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 16, fontSize: 13, color: '#888' }}>Loading JSA...</div>

  const isCompleted = !!jsa?.completed_at

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 10,
      padding: `24px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      marginBottom: 12 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
          Job Safety Analysis (JSA)
        </h2>
        {isCompleted && (
          <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px',
            borderRadius: 20, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
            ✓ Completed {new Date(jsa!.completed_at!).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Hazards */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Identified Hazards
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HAZARDS.map(hazard => (
            <label key={hazard}
              style={{ display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: '#1a1a1a', cursor: isCompleted ? 'default' : 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedHazards.includes(hazard)}
                onChange={() => !isCompleted && toggleHazard(hazard)}
                disabled={isCompleted}
                style={{ width: 15, height: 15, cursor: isCompleted ? 'default' : 'pointer' }}
              />
              {hazard}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Additional Notes / Control Measures
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={isCompleted}
          placeholder="Describe control measures for identified hazards..."
          rows={3}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid #e0e0e0', fontSize: 13, resize: 'vertical',
            fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
            backgroundColor: isCompleted ? '#140c0c' : '#ffffff',
            color: '#1a1a1a' }}
        />
      </div>

      {/* Signatures */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Crew Signatures
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {signatures.map((sig, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input
                value={sig}
                onChange={e => updateSignature(i, e.target.value)}
                disabled={isCompleted}
                placeholder={`Crew member ${i + 1} name`}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #ffffff', fontSize: 13,
                  backgroundColor: isCompleted ? '#ffffff' : '#000000' }}
              />
              {!isCompleted && signatures.length > 1 && (
                <button onClick={() => removeSignature(i)}
                  style={{ padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e0c9c9', backgroundColor: 'transparent',
                    color: '#c62828', fontSize: 13, cursor: 'pointer' }}>
                  ×
                </button>
              )}
            </div>
          ))}
          {!isCompleted && (
            <button onClick={addSignature}
              style={{ alignSelf: 'flex-start', padding: '6px 12px',
                borderRadius: 8, border: '1px solid #e0e0e0',
                backgroundColor: 'transparent', fontSize: 13,
                color: '#666', cursor: 'pointer' }}>
              + Add crew member
            </button>
          )}
        </div>
      </div>

      {/* Submit */}
      {!isCompleted && (
        <button onClick={handleComplete} disabled={saving}
          style={{ width: '100%', backgroundColor: '#2e7d32', color: '#fff',
            border: 'none', borderRadius: 8, padding: 12,
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : '✓ Complete JSA — Ready to Work'}
        </button>
      )}
    </div>
  )
}