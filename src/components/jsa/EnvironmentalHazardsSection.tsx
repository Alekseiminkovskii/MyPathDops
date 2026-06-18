import { Section } from './Section'
import { ChecklistGrid, type ChecklistValue } from './ChecklistGrid'

const WEATHER_LABELS = ['Rain', 'Wind', 'Sun', 'Snow/Ice', 'Thunder/Lightning', 'Heat/Cold', 'Darkness']
const BIOLOGICAL_LABELS = [
  'Birds/Animals/Reptiles', 'Bird Droppings', 'Bees/Wasps/Hornets', 'Ticks',
  'Poison Ivy/Oak/Sumac', 'Tall Grass/Brush', 'Other Insects',
]
const ENVIRONMENT_LABELS = [
  'Electrical', 'RF Exposure', 'Noise > 85dB',
  'Humans (High Crime Area/Isolation/Threats)', 'Vehicle Traffic',
  'Utilities (Gas, Electric, Water)', 'Terrain',
]

interface Props {
  value: Record<string, ChecklistValue>
  onChange: (value: Record<string, ChecklistValue>) => void
  disabled?: boolean
}

export function EnvironmentalHazardsSection({ value, onChange, disabled }: Props) {
  function setLabel(label: string, v: ChecklistValue) {
    onChange({ ...value, [label]: v })
  }

  return (
    <Section title="Environmental Hazards Assessment">
      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 }}>Weather</div>
      <ChecklistGrid labels={WEATHER_LABELS} values={value} disabled={disabled}
        options={['yes', 'no']} onChange={setLabel} />

      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', margin: '14px 0 6px' }}>Biological</div>
      <ChecklistGrid labels={BIOLOGICAL_LABELS} values={value} disabled={disabled}
        options={['yes', 'no']} onChange={setLabel} />

      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', margin: '14px 0 6px' }}>Environment</div>
      <ChecklistGrid labels={ENVIRONMENT_LABELS} values={value} disabled={disabled}
        options={['yes', 'no']} onChange={setLabel} />
    </Section>
  )
}
