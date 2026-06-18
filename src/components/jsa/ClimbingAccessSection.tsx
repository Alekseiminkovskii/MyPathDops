import { Section } from './Section'
import { YesNoToggle } from './YesNoToggle'

const ACCESS_METHODS = [
  'No Climbing, alternate methods of access', 'Ladder w/ Slip-In Rung', 'Ladder w/ Welded Rung',
  'Ladder w/ Bolted Rung', 'Peg w/ Slip-In Peg', 'Peg w/ Bolt-In Peg', 'Controlled Descent', 'Cable Climb',
]

export interface ClimbingAccess {
  climbing_access_method: string
  safety_climb_used: boolean | null
  safety_climb_inspected: boolean | null
}

interface Props {
  value: ClimbingAccess
  onChange: (value: ClimbingAccess) => void
  disabled?: boolean
}

export function ClimbingAccessSection({ value, onChange, disabled }: Props) {
  function set<K extends keyof ClimbingAccess>(key: K, v: ClimbingAccess[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <Section title="Structure & Climbing Path Access">
      <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 10 }}>
        Access Method
        <select value={value.climbing_access_method} disabled={disabled}
          onChange={e => set('climbing_access_method', e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px',
            borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, color: '#1a1a1a', backgroundColor: '#fff' }}>
          <option value="">Select...</option>
          {ACCESS_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <YesNoToggle label="Will you be using a safety climb?" value={value.safety_climb_used} disabled={disabled}
        onChange={v => set('safety_climb_used', v)} />
      <YesNoToggle label="Safety cable climb inspected prior to use?" value={value.safety_climb_inspected} disabled={disabled}
        onChange={v => set('safety_climb_inspected', v)} />
    </Section>
  )
}
