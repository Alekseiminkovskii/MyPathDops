import { Section } from './Section'
import { ChecklistGrid, type ChecklistValue } from './ChecklistGrid'

const WORK_AREA_HAZARD_LABELS = [
  'Electrical', 'Fire Hazards', 'Noise', 'Hand & Power Tools', 'Hand Hazards',
  'Manual Lifting', 'Ladders', 'Slips, Trips and Falls', 'Barricades',
  'Working with Chemicals', 'Heat Stress Potential', 'Cold Stress Potential',
  'Adjacent Work', 'Pinch Points',
]

interface Props {
  value: Record<string, ChecklistValue>
  onChange: (value: Record<string, ChecklistValue>) => void
  disabled?: boolean
}

export function WorkAreaHazardsSection({ value, onChange, disabled }: Props) {
  return (
    <Section title="Work Area Hazard Analysis">
      <ChecklistGrid labels={WORK_AREA_HAZARD_LABELS} values={value} disabled={disabled}
        options={['yes', 'no']}
        onChange={(label, v) => onChange({ ...value, [label]: v })} />
    </Section>
  )
}
