import { Section } from './Section'
import { ChecklistGrid, type ChecklistValue } from './ChecklistGrid'

const LABELS = [
  'Log book signed and NOC notified (if applicable)',
  'Construction area secured (fenced, barrier tape, warning signs, etc.)',
  'All trenches covered and/or barriers in place',
  'No material or equipment left in an unsafe suspended condition',
  'Shelter, gang boxes, and/or equipment doors closed and secured/locked',
  'Warning/no trespassing signs visible',
  'Gate locked when leaving site',
]

interface Props {
  value: Record<string, ChecklistValue>
  onChange: (value: Record<string, ChecklistValue>) => void
  disabled?: boolean
}

export function LastFiveMinutesSection({ value, onChange, disabled }: Props) {
  return (
    <Section title="The Last Five Minutes (before leaving site)">
      <p style={{ fontSize: 12, color: '#888', marginTop: 0, marginBottom: 10 }}>
        Quick assessment of the site before leaving — check each item if satisfactory.
      </p>
      <ChecklistGrid labels={LABELS} values={value} disabled={disabled}
        options={['yes', 'no']}
        onChange={(label, v) => onChange({ ...value, [label]: v })} />
    </Section>
  )
}
