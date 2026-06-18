export type ChecklistValue = 'yes' | 'no' | 'na' | null

interface Props {
  labels: string[]
  values: Record<string, ChecklistValue>
  onChange: (label: string, value: ChecklistValue) => void
  disabled?: boolean
  options?: ChecklistValue[]
}

const OPTION_LABEL: Record<Exclude<ChecklistValue, null>, string> = { yes: 'Yes', no: 'No', na: 'N/A' }
const OPTION_COLOR: Record<Exclude<ChecklistValue, null>, { bg: string; color: string }> = {
  yes: { bg: '#e8f5e9', color: '#2e7d32' },
  no:  { bg: '#ffebee', color: '#c62828' },
  na:  { bg: '#f5f5f5', color: '#888' },
}

export function ChecklistGrid({ labels, values, onChange, disabled, options = ['yes', 'no', 'na'] }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {labels.map(label => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 8, fontSize: 13, color: '#1a1a1a', padding: '4px 0' }}>
          <span>{label}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {options.map(opt => {
              if (!opt) return null
              const selected = values[label] === opt
              const palette = selected ? OPTION_COLOR[opt] : { bg: '#fff', color: '#999' }
              return (
                <button key={opt} disabled={disabled}
                  onClick={() => onChange(label, opt)}
                  style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                    border: `1px solid ${selected ? palette.color : '#e0e0e0'}`,
                    backgroundColor: palette.bg, color: palette.color,
                    cursor: disabled ? 'default' : 'pointer' }}>
                  {OPTION_LABEL[opt]}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
