import { Section } from './Section'

const inputStyle = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, color: '#1a1a1a', backgroundColor: '#fff' }

export interface JobInfo {
  customer: string
  job_address: string
  tower_owner: string
  check_in_time: string
  check_out_time: string
}

interface Props {
  value: JobInfo
  onChange: (value: JobInfo) => void
  disabled?: boolean
}

export function JobInfoSection({ value, onChange, disabled }: Props) {
  function set<K extends keyof JobInfo>(key: K, v: JobInfo[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <Section title="Job Information">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 12, color: '#888' }}>Customer
          <input value={value.customer} disabled={disabled}
            onChange={e => set('customer', e.target.value)}
            style={{ ...inputStyle, width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
        </label>
        <label style={{ fontSize: 12, color: '#888' }}>Job Address
          <input value={value.job_address} disabled={disabled}
            onChange={e => set('job_address', e.target.value)}
            style={{ ...inputStyle, width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
        </label>
        <label style={{ fontSize: 12, color: '#888' }}>Tower Owner
          <input value={value.tower_owner} disabled={disabled}
            onChange={e => set('tower_owner', e.target.value)}
            style={{ ...inputStyle, width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ fontSize: 12, color: '#888', flex: 1 }}>Check-In Time
            <input value={value.check_in_time} disabled={disabled}
              placeholder="e.g. 11:00 AM"
              onChange={e => set('check_in_time', e.target.value)}
              style={{ ...inputStyle, width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
          </label>
          <label style={{ fontSize: 12, color: '#888', flex: 1 }}>Check-Out Time
            <input value={value.check_out_time} disabled={disabled}
              placeholder="e.g. 6:00 PM"
              onChange={e => set('check_out_time', e.target.value)}
              style={{ ...inputStyle, width: '100%', marginTop: 4, boxSizing: 'border-box' }} />
          </label>
        </div>
      </div>
    </Section>
  )
}
