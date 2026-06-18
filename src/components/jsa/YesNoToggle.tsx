interface Props {
  label: string
  value: boolean | null
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function YesNoToggle({ label, value, onChange, disabled }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', gap: 8, fontSize: 13, color: '#1a1a1a', padding: '4px 0' }}>
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button disabled={disabled} onClick={() => onChange(true)} style={{
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${value === true ? '#2e7d32' : '#e0e0e0'}`,
          backgroundColor: value === true ? '#e8f5e9' : '#fff',
          color: value === true ? '#2e7d32' : '#999', cursor: disabled ? 'default' : 'pointer' }}>
          Yes
        </button>
        <button disabled={disabled} onClick={() => onChange(false)} style={{
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${value === false ? '#c62828' : '#e0e0e0'}`,
          backgroundColor: value === false ? '#ffebee' : '#fff',
          color: value === false ? '#c62828' : '#999', cursor: disabled ? 'default' : 'pointer' }}>
          No
        </button>
      </div>
    </div>
  )
}
