import { Section } from './Section'
import { YesNoToggle } from './YesNoToggle'

const DEFAULT_RESCUE_PLAN = `Tower Rescue Procedure – Controlled Descent

In the event of a fall or incident, all work will stop immediately. The designated Rescue Lead will call 911 and state: "We have a tower rescue in progress and need medical assistance." Exact site location and access information will be provided.

If the victim cannot self-rescue, the closest trained climber will secure themselves and prepare for rescue. A controlled descent rescue will be performed as follows:

Rescuer connects a descender to the rescue rope above the victim. Attach victim's back D-ring to the descender system using a locking carabiner. Victim must never be suspended from rescuer's harness. Use a mechanical advantage system to release the victim from their fall-arrest system. Rescuer and victim descend together in a slow and controlled manner.

Once on the ground, EMS assumes care; if EMS has not arrived, crew members trained in First Aid/CPR assist until EMS arrives.

All rescue equipment will be onsite, inspected daily, and all climbers are trained and capable of performing this rescue procedure.`

export interface RescuePlan {
  cell_coverage: boolean | null
  first_aid_kit_onsite: boolean | null
  fire_extinguisher_onsite: boolean | null
  safety_banner_posted: boolean | null
  crew_trained_for_rescue: boolean | null
  rescue_plan_text: string
}

interface Props {
  value: RescuePlan
  onChange: (value: RescuePlan) => void
  disabled?: boolean
}

export function RescuePlanSection({ value, onChange, disabled }: Props) {
  function set<K extends keyof RescuePlan>(key: K, v: RescuePlan[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <Section title="Emergency and Rescue Plan">
      <YesNoToggle label="Is cell phone coverage available?" value={value.cell_coverage} disabled={disabled}
        onChange={v => set('cell_coverage', v)} />
      <YesNoToggle label="Is First Aid Kit on site and accessible to all crew?" value={value.first_aid_kit_onsite} disabled={disabled}
        onChange={v => set('first_aid_kit_onsite', v)} />
      <YesNoToggle label="Is Fire Extinguisher on site and accessible to all crew?" value={value.fire_extinguisher_onsite} disabled={disabled}
        onChange={v => set('fire_extinguisher_onsite', v)} />
      <YesNoToggle label="Safety banner posted at site entrance?" value={value.safety_banner_posted} disabled={disabled}
        onChange={v => set('safety_banner_posted', v)} />
      <YesNoToggle label="In-house crew properly trained for rescue?" value={value.crew_trained_for_rescue} disabled={disabled}
        onChange={v => set('crew_trained_for_rescue', v)} />

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>
          Detailed Rescue Plan <span style={{ fontWeight: 400, fontStyle: 'italic' }}>(example shown below — write your own)</span>
        </div>
        <textarea value={value.rescue_plan_text} disabled={disabled}
          placeholder={DEFAULT_RESCUE_PLAN}
          onChange={e => set('rescue_plan_text', e.target.value)}
          rows={8} style={{ width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid #e0e0e0', fontSize: 12, lineHeight: 1.5, resize: 'vertical',
            fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', color: '#1a1a1a',
            backgroundColor: disabled ? '#fafafa' : '#fff' }} />
      </div>
    </Section>
  )
}
