import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { getTaskReference } from '../data/safetyTaskReference'
import type { ChecklistValue } from './jsa/ChecklistGrid'

interface Job {
  id: number
  site_name: string
  status: string
  date: string
}

interface CrewSignature {
  name: string
  signature: string | null
  signed_at: string | null
}

interface JSA {
  id: number
  hazards: string[]
  notes: string
  crew_signatures: CrewSignature[] | null
  completed_at: string | null
  jsa_approved: boolean
  jsa_approved_at: string | null

  customer: string | null
  job_address: string | null
  tower_owner: string | null
  check_in_time: string | null
  check_out_time: string | null

  hospital_name: string | null
  hospital_address: string | null
  hospital_phone: string | null
  fire_dept_name: string | null
  fire_dept_phone: string | null
  police_dept_name: string | null
  police_dept_phone: string | null
  sheriff_dept_name: string | null
  sheriff_dept_phone: string | null
  weather: { temperatureF: number; windMph: number; conditions: string } | null
  weather_fetched_at: string | null
  driving_directions: { distanceMiles: number; steps: string[] } | null

  cell_coverage: boolean | null
  first_aid_kit_onsite: boolean | null
  fire_extinguisher_onsite: boolean | null
  safety_banner_posted: boolean | null
  crew_trained_for_rescue: boolean | null
  rescue_plan_text: string | null

  tools_tethered: boolean | null
  bags_sealed: boolean | null
  drop_zone_red: boolean | null
  drop_zone_yellow: boolean | null

  work_area_hazards: Record<string, ChecklistValue> | null
  environmental_hazards: Record<string, ChecklistValue> | null
  ppe: Record<string, ChecklistValue> | null
  pfas: Record<string, ChecklistValue> | null

  structure_type: string | null
  structure_overloaded: boolean | null
  rigging_required: boolean | null
  rigging_plan_onsite: boolean | null
  rigging_plan_reviewed: boolean | null

  climbing_access_method: string | null
  safety_climb_used: boolean | null
  safety_climb_inspected: boolean | null

  safety_tasks: string[] | null
  last_five_minutes: Record<string, ChecklistValue> | null
}

interface Props { job: Job; jsa: JSA }

const s = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', backgroundColor: '#fff' },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#888', marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111',
    backgroundColor: '#f0f0f0', padding: 6, marginBottom: 6, marginTop: 14 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { fontSize: 9, color: '#888', width: 160 },
  value: { fontSize: 9, color: '#111', flex: 1 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between',
    borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingVertical: 3 },
  gridLabel: { fontSize: 9, color: '#222' },
  gridValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  bullet: { fontSize: 8.5, color: '#444', marginBottom: 2, lineHeight: 1.4 },
  taskHeading: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111', marginTop: 8, marginBottom: 2 },
  hazardHeading: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#555', marginTop: 4 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32,
    fontSize: 7, color: '#aaa', textAlign: 'center' },
  sigBlock: { marginBottom: 18, borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingBottom: 10 },
  sigImage: { width: 180, height: 70, objectFit: 'contain', marginTop: 4, marginBottom: 4 },
  sigName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111' },
  sigMeta: { fontSize: 8, color: '#888' },
})

function valueColor(v: ChecklistValue) {
  if (v === 'yes') return '#2e7d32'
  if (v === 'no') return '#c62828'
  return '#888'
}

function ChecklistTable({ data }: { data: Record<string, ChecklistValue> | null }) {
  const entries = Object.entries(data || {})
  if (entries.length === 0) return <Text style={s.bullet}>Not recorded.</Text>
  return (
    <View>
      {entries.map(([label, value]) => (
        <View key={label} style={s.gridRow}>
          <Text style={s.gridLabel}>{label}</Text>
          <Text style={[s.gridValue, { color: valueColor(value) }]}>
            {value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value === 'na' ? 'N/A' : '—'}
          </Text>
        </View>
      ))}
    </View>
  )
}

function yn(v: boolean | null) {
  return v === true ? 'Yes' : v === false ? 'No' : '—'
}

export function SPADocument({ job, jsa }: Props) {
  const crew = jsa.crew_signatures || []

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Daily Safe Plan of Action (SPA)</Text>
        <Text style={s.subtitle}>
          {job.site_name} · Job #{job.id} · {job.date}
          {jsa.completed_at && `  ·  Completed ${new Date(jsa.completed_at).toLocaleString('en-US')}`}
          {jsa.jsa_approved && `  ·  Approved ${new Date(jsa.jsa_approved_at!).toLocaleString('en-US')}`}
        </Text>

        <Text style={s.sectionTitle}>Job Information</Text>
        <View style={s.row}><Text style={s.label}>Customer</Text><Text style={s.value}>{jsa.customer || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Job Address</Text><Text style={s.value}>{jsa.job_address || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Tower Owner</Text><Text style={s.value}>{jsa.tower_owner || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Check-In / Check-Out</Text>
          <Text style={s.value}>{jsa.check_in_time || '—'} / {jsa.check_out_time || '—'}</Text></View>

        <Text style={s.sectionTitle}>Emergency Locations</Text>
        <View style={s.row}><Text style={s.label}>Hospital</Text>
          <Text style={s.value}>{jsa.hospital_name || '—'} — {jsa.hospital_address || '—'} — {jsa.hospital_phone || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Fire Department</Text>
          <Text style={s.value}>{jsa.fire_dept_name || '—'} — {jsa.fire_dept_phone || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Police Department</Text>
          <Text style={s.value}>{jsa.police_dept_name || '—'} — {jsa.police_dept_phone || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Sheriff Department</Text>
          <Text style={s.value}>{jsa.sheriff_dept_name || '—'} — {jsa.sheriff_dept_phone || '—'}</Text></View>

        {jsa.weather && (
          <View style={s.row}><Text style={s.label}>Weather at site</Text>
            <Text style={s.value}>
              {jsa.weather.conditions} · {jsa.weather.temperatureF}°F · wind {jsa.weather.windMph} mph
              {jsa.weather_fetched_at && ` (as of ${new Date(jsa.weather_fetched_at).toLocaleString('en-US')})`}
            </Text>
          </View>
        )}
        {jsa.driving_directions && (
          <View>
            <Text style={s.hazardHeading}>Directions to Hospital — {jsa.driving_directions.distanceMiles} mi</Text>
            {jsa.driving_directions.steps.map((step, i) => (
              <Text key={i} style={s.bullet}>{i + 1}. {step}</Text>
            ))}
          </View>
        )}

        <Text style={s.sectionTitle}>Emergency and Rescue Plan</Text>
        <View style={s.row}><Text style={s.label}>Cell coverage available</Text><Text style={s.value}>{yn(jsa.cell_coverage)}</Text></View>
        <View style={s.row}><Text style={s.label}>First Aid Kit on site</Text><Text style={s.value}>{yn(jsa.first_aid_kit_onsite)}</Text></View>
        <View style={s.row}><Text style={s.label}>Fire Extinguisher on site</Text><Text style={s.value}>{yn(jsa.fire_extinguisher_onsite)}</Text></View>
        <View style={s.row}><Text style={s.label}>Safety banner posted</Text><Text style={s.value}>{yn(jsa.safety_banner_posted)}</Text></View>
        <View style={s.row}><Text style={s.label}>Crew trained for rescue</Text><Text style={s.value}>{yn(jsa.crew_trained_for_rescue)}</Text></View>
        {jsa.rescue_plan_text && <Text style={s.bullet}>{jsa.rescue_plan_text}</Text>}

        <Text style={s.sectionTitle}>Tools & Equipment / Drop Zone</Text>
        <View style={s.row}><Text style={s.label}>Tools tethered at height</Text><Text style={s.value}>{yn(jsa.tools_tethered)}</Text></View>
        <View style={s.row}><Text style={s.label}>Buckets/bags sealed</Text><Text style={s.value}>{yn(jsa.bags_sealed)}</Text></View>
        <View style={s.row}><Text style={s.label}>Drop zone — RED ZONE</Text><Text style={s.value}>{yn(jsa.drop_zone_red)}</Text></View>
        <View style={s.row}><Text style={s.label}>Drop zone — YELLOW ZONE</Text><Text style={s.value}>{yn(jsa.drop_zone_yellow)}</Text></View>

        <Text style={s.footer}>MyPathDops — Daily Safe Plan of Action — CONFIDENTIAL</Text>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Work Area Hazard Analysis</Text>
        <ChecklistTable data={jsa.work_area_hazards} />

        <Text style={s.sectionTitle}>Environmental Hazards Assessment</Text>
        <ChecklistTable data={jsa.environmental_hazards} />

        <Text style={s.sectionTitle}>PPE</Text>
        <ChecklistTable data={jsa.ppe} />

        <Text style={s.sectionTitle}>PFAS (Fall Protection)</Text>
        <ChecklistTable data={jsa.pfas} />

        <Text style={s.footer}>MyPathDops — Daily Safe Plan of Action — CONFIDENTIAL</Text>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Structural Hazards & Rigging</Text>
        <View style={s.row}><Text style={s.label}>Structure type</Text><Text style={s.value}>{jsa.structure_type || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Structure overloaded</Text><Text style={s.value}>{yn(jsa.structure_overloaded)}</Text></View>
        <View style={s.row}><Text style={s.label}>Rigging required</Text><Text style={s.value}>{yn(jsa.rigging_required)}</Text></View>
        <View style={s.row}><Text style={s.label}>Construction plan on-site</Text><Text style={s.value}>{yn(jsa.rigging_plan_onsite)}</Text></View>
        <View style={s.row}><Text style={s.label}>Plan reviewed (class 3/4)</Text><Text style={s.value}>{yn(jsa.rigging_plan_reviewed)}</Text></View>

        <Text style={s.sectionTitle}>Structure & Climbing Path Access</Text>
        <View style={s.row}><Text style={s.label}>Access method</Text><Text style={s.value}>{jsa.climbing_access_method || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Using safety climb</Text><Text style={s.value}>{yn(jsa.safety_climb_used)}</Text></View>
        <View style={s.row}><Text style={s.label}>Safety climb inspected</Text><Text style={s.value}>{yn(jsa.safety_climb_inspected)}</Text></View>

        <Text style={s.sectionTitle}>Safety Task(s) for the Day</Text>
        {(jsa.safety_tasks || []).length === 0 && <Text style={s.bullet}>None selected.</Text>}
        {(jsa.safety_tasks || []).map(task => (
          <View key={task}>
            <Text style={s.taskHeading}>{task}</Text>
            {getTaskReference(task).map(({ hazard, measures }) => (
              <View key={hazard}>
                <Text style={s.hazardHeading}>({hazard})</Text>
                {measures.map((m, i) => <Text key={i} style={s.bullet}>- {m}</Text>)}
              </View>
            ))}
          </View>
        ))}

        <Text style={s.footer}>MyPathDops — Daily Safe Plan of Action — CONFIDENTIAL</Text>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Identified Hazards</Text>
        {jsa.hazards.length === 0 ? <Text style={s.bullet}>None selected.</Text> :
          jsa.hazards.map(h => <Text key={h} style={s.bullet}>• {h}</Text>)}
        {jsa.notes && (
          <View>
            <Text style={s.hazardHeading}>Additional Notes / Control Measures</Text>
            <Text style={s.bullet}>{jsa.notes}</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>The Last Five Minutes</Text>
        <ChecklistTable data={jsa.last_five_minutes} />

        <Text style={s.sectionTitle}>Crew Signatures</Text>
        {crew.length === 0 ? <Text style={s.bullet}>No signatures recorded.</Text> :
          crew.map((c, i) => (
            <View key={i} style={s.sigBlock}>
              <Text style={s.sigName}>{c.name}</Text>
              {c.signature && <Image src={c.signature} style={s.sigImage} />}
              {c.signed_at && <Text style={s.sigMeta}>Signed {new Date(c.signed_at).toLocaleString('en-US')}</Text>}
            </View>
          ))}

        <Text style={s.footer}>MyPathDops — Daily Safe Plan of Action — CONFIDENTIAL</Text>
      </Page>
    </Document>
  )
}
