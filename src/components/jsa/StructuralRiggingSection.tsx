import { useState } from 'react'
import { Section } from './Section'
import { YesNoToggle } from './YesNoToggle'

const KNOWN_STRUCTURE_TYPES = ['Monopole', 'Self Support Tower', 'Guyed Tower', 'Rooftop', 'Water Tank']
const inputStyle = { display: 'block', width: '100%', marginTop: 4, padding: '8px 12px',
  borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, color: '#1a1a1a', backgroundColor: '#fff' }

export interface StructuralRigging {
  structure_type: string
  structure_overloaded: boolean | null
  rigging_required: boolean | null
  rigging_plan_onsite: boolean | null
  rigging_plan_reviewed: boolean | null
}

interface Props {
  value: StructuralRigging
  onChange: (value: StructuralRigging) => void
  disabled?: boolean
}

export function StructuralRiggingSection({ value, onChange, disabled }: Props) {
  const [customMode, setCustomMode] = useState(
    value.structure_type !== '' && !KNOWN_STRUCTURE_TYPES.includes(value.structure_type)
  )

  function set<K extends keyof StructuralRigging>(key: K, v: StructuralRigging[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <Section title="Structural Hazards & Rigging">
      <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 10 }}>
        Type of structure being worked on
        {customMode ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input value={value.structure_type} disabled={disabled} autoFocus
              placeholder="Describe the structure"
              onChange={e => set('structure_type', e.target.value)}
              style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
            {!disabled && (
              <button onClick={() => { setCustomMode(false); set('structure_type', '') }}
                style={{ fontSize: 12, color: '#1565c0', background: 'none',
                  border: '1px solid #e0e0e0', borderRadius: 8, padding: '0 12px', cursor: 'pointer' }}>
                ← Back to list
              </button>
            )}
          </div>
        ) : (
          <select value={value.structure_type} disabled={disabled}
            onChange={e => e.target.value === 'Other' ? setCustomMode(true) : set('structure_type', e.target.value)}
            style={inputStyle}>
            <option value="">Select...</option>
            {KNOWN_STRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="Other">Other (specify)</option>
          </select>
        )}
      </label>
      <YesNoToggle label="Structure appears overloaded" value={value.structure_overloaded} disabled={disabled}
        onChange={v => set('structure_overloaded', v)} />
      <YesNoToggle label="Will rigging be required on site?" value={value.rigging_required} disabled={disabled}
        onChange={v => set('rigging_required', v)} />
      <YesNoToggle label="Compliant construction plan (ANSI 10.48) on-site?" value={value.rigging_plan_onsite} disabled={disabled}
        onChange={v => set('rigging_plan_onsite', v)} />
      <YesNoToggle label="Construction plan reviewed for class 3 or 4?" value={value.rigging_plan_reviewed} disabled={disabled}
        onChange={v => set('rigging_plan_reviewed', v)} />
    </Section>
  )
}
