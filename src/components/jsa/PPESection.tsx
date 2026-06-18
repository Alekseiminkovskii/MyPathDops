import { Section } from './Section'
import { ChecklistGrid, type ChecklistValue } from './ChecklistGrid'

const PPE_LABELS = ['Hard Hat', 'Safety Glasses', 'Protective Clothing', 'Gloves', 'Boots', 'High Visibility Attire']

interface Props {
  value: Record<string, ChecklistValue>
  onChange: (value: Record<string, ChecklistValue>) => void
  disabled?: boolean
}

export function PPESection({ value, onChange, disabled }: Props) {
  return (
    <Section title="PPE">
      <ChecklistGrid labels={PPE_LABELS} values={value} disabled={disabled}
        options={['yes', 'no']}
        onChange={(label, v) => onChange({ ...value, [label]: v })} />
    </Section>
  )
}
