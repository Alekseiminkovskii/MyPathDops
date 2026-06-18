import { Section } from './Section'
import { YesNoToggle } from './YesNoToggle'

export interface ToolsEquipment {
  tools_tethered: boolean | null
  bags_sealed: boolean | null
  drop_zone_red: boolean | null
  drop_zone_yellow: boolean | null
}

interface Props {
  value: ToolsEquipment
  onChange: (value: ToolsEquipment) => void
  disabled?: boolean
}

export function ToolsEquipmentSection({ value, onChange, disabled }: Props) {
  function set<K extends keyof ToolsEquipment>(key: K, v: ToolsEquipment[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <Section title="Tools & Equipment / Drop Zone">
      <YesNoToggle label="All tools tethered at height" value={value.tools_tethered} disabled={disabled}
        onChange={v => set('tools_tethered', v)} />
      <YesNoToggle label="All buckets/bags covered/sealed" value={value.bags_sealed} disabled={disabled}
        onChange={v => set('bags_sealed', v)} />
      <YesNoToggle label="Drop zone — RED ZONE dimensions/demarcation" value={value.drop_zone_red} disabled={disabled}
        onChange={v => set('drop_zone_red', v)} />
      <YesNoToggle label="Drop zone — YELLOW ZONE dimensions/demarcation" value={value.drop_zone_yellow} disabled={disabled}
        onChange={v => set('drop_zone_yellow', v)} />
    </Section>
  )
}
