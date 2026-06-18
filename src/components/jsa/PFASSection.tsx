import { Section } from './Section'
import { ChecklistGrid, type ChecklistValue } from './ChecklistGrid'

const PFAS_LABELS = [
  'Full Body Harness', 'Y-Lanyard', 'SRL', 'Positioning Lanyard',
  'Saf-Cable Grab', 'Rope Grab', 'Vertical Life Line', 'Horizontal Life Line',
]

interface Props {
  value: Record<string, ChecklistValue>
  onChange: (value: Record<string, ChecklistValue>) => void
  disabled?: boolean
}

export function PFASSection({ value, onChange, disabled }: Props) {
  return (
    <Section title="PFAS (Fall Protection)">
      <ChecklistGrid labels={PFAS_LABELS} values={value} disabled={disabled}
        options={['yes', 'no', 'na']}
        onChange={(label, v) => onChange({ ...value, [label]: v })} />
    </Section>
  )
}
