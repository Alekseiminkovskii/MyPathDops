import { Section } from './Section'
import { SAFETY_TASKS, getTaskReference } from '../../data/safetyTaskReference'

interface Props {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function SafetyTasksSection({ value, onChange, disabled }: Props) {
  function toggle(task: string) {
    onChange(value.includes(task) ? value.filter(t => t !== task) : [...value, task])
  }

  return (
    <Section title="Safety Task(s) for the Day" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {SAFETY_TASKS.map(task => (
          <label key={task} style={{ display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13, color: '#1a1a1a', cursor: disabled ? 'default' : 'pointer' }}>
            <input type="checkbox" checked={value.includes(task)} disabled={disabled}
              onChange={() => toggle(task)}
              style={{ width: 15, height: 15, cursor: disabled ? 'default' : 'pointer' }} />
            {task}
          </label>
        ))}
      </div>

      {value.map(task => (
        <div key={task} style={{ marginBottom: 16, padding: 12, backgroundColor: '#fffde7',
          borderRadius: 8, border: '1px solid #fff3c4' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>{task}</div>
          {getTaskReference(task).map(({ hazard, measures }) => (
            <div key={hazard} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>({hazard})</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12, color: '#444', lineHeight: 1.5 }}>
                {measures.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </Section>
  )
}
