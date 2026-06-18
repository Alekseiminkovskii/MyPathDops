import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useRole } from '../hooks/useRole'
import { Section } from './jsa/Section'
import { JobInfoSection, type JobInfo } from './jsa/JobInfoSection'
import { EmergencyContactsSection, type EmergencyContacts, type LiveConditions } from './jsa/EmergencyContactsSection'
import { RescuePlanSection, type RescuePlan } from './jsa/RescuePlanSection'
import { ToolsEquipmentSection, type ToolsEquipment } from './jsa/ToolsEquipmentSection'
import { WorkAreaHazardsSection } from './jsa/WorkAreaHazardsSection'
import { EnvironmentalHazardsSection } from './jsa/EnvironmentalHazardsSection'
import { PPESection } from './jsa/PPESection'
import { PFASSection } from './jsa/PFASSection'
import { StructuralRiggingSection, type StructuralRigging } from './jsa/StructuralRiggingSection'
import { ClimbingAccessSection, type ClimbingAccess } from './jsa/ClimbingAccessSection'
import { SafetyTasksSection } from './jsa/SafetyTasksSection'
import { LastFiveMinutesSection } from './jsa/LastFiveMinutesSection'
import { SignatureModal } from './jsa/SignatureModal'
import { generateAndSendSpaPdf } from '../lib/sendSpaPdf'
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

const HAZARDS = [
  'Working at heights / Tower climbing',
  'Electrical hazards',
  'Heavy lifting / Manual handling',
  'Traffic / Vehicle hazards',
  'Adverse weather conditions',
  'Falling objects / Dropped tools',
  'RF / EMF exposure',
  'Hand and power tools',
  'Confined spaces',
  'Slippery or unstable surfaces',
]

interface JSA {
  id: number
  job_id: number
  hazards: string[]
  notes: string
  crew_signatures: CrewSignature[] | null
  completed_at: string | null
  jsa_approved: boolean
  jsa_approved_at: string | null
  jsa_approved_by: string | null

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
  site_lat: number | null
  site_lng: number | null
  weather: LiveConditions['weather']
  weather_fetched_at: string | null
  driving_directions: LiveConditions['driving_directions']

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

interface Props { jobId: number }

const S = 20

const EMPTY_CONTACTS: EmergencyContacts = {
  hospital_name: '', hospital_address: '', hospital_phone: '',
  fire_dept_name: '', fire_dept_phone: '',
  police_dept_name: '', police_dept_phone: '',
  sheriff_dept_name: '', sheriff_dept_phone: '',
}

export function JSAForm({ jobId }: Props) {
  const { role } = useRole()

  const [jsa, setJsa]         = useState<JSA | null>(null)
  const [job, setJob]         = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [approvingJSA, setApprovingJSA] = useState(false)
  const [sendingPdf, setSendingPdf] = useState(false)
  const [emailStatus, setEmailStatus] = useState('')

  const [selectedHazards, setSelectedHazards] = useState<string[]>([])
  const [notes, setNotes]           = useState('')
  const [crewSignatures, setCrewSignatures] = useState<CrewSignature[]>([{ name: '', signature: null, signed_at: null }])
  const [signModalIndex, setSignModalIndex] = useState<number | null>(null)

  const [jobInfo, setJobInfo] = useState<JobInfo>({ customer: '', job_address: '', tower_owner: '', check_in_time: '', check_out_time: '' })
  const [contacts, setContacts] = useState<EmergencyContacts>(EMPTY_CONTACTS)
  const [live, setLive] = useState<LiveConditions>({ site_lat: null, site_lng: null, weather: null, weather_fetched_at: null, driving_directions: null })
  const [rescuePlan, setRescuePlan] = useState<RescuePlan>({
    cell_coverage: null, first_aid_kit_onsite: null, fire_extinguisher_onsite: null,
    safety_banner_posted: null, crew_trained_for_rescue: null, rescue_plan_text: '',
  })
  const [toolsEquipment, setToolsEquipment] = useState<ToolsEquipment>({
    tools_tethered: null, bags_sealed: null, drop_zone_red: null, drop_zone_yellow: null,
  })
  const [workAreaHazards, setWorkAreaHazards] = useState<Record<string, ChecklistValue>>({})
  const [environmentalHazards, setEnvironmentalHazards] = useState<Record<string, ChecklistValue>>({})
  const [ppe, setPpe] = useState<Record<string, ChecklistValue>>({})
  const [pfas, setPfas] = useState<Record<string, ChecklistValue>>({})
  const [structuralRigging, setStructuralRigging] = useState<StructuralRigging>({
    structure_type: '', structure_overloaded: null, rigging_required: null,
    rigging_plan_onsite: null, rigging_plan_reviewed: null,
  })
  const [climbingAccess, setClimbingAccess] = useState<ClimbingAccess>({
    climbing_access_method: '', safety_climb_used: null, safety_climb_inspected: null,
  })
  const [safetyTasks, setSafetyTasks] = useState<string[]>([])
  const [lastFiveMinutes, setLastFiveMinutes] = useState<Record<string, ChecklistValue>>({})

  useEffect(() => {
    async function fetchJSA() {
      const [{ data: jobData }, { data }] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', jobId).single(),
        supabase.from('jsa').select('*').eq('job_id', jobId).maybeSingle(),
      ])
      if (jobData) setJob(jobData as Job)
      if (data) {
        const d = data as JSA
        setJsa(d)
        setSelectedHazards(d.hazards || [])
        setNotes(d.notes || '')
        setCrewSignatures(d.crew_signatures?.length ? d.crew_signatures : [{ name: '', signature: null, signed_at: null }])
        setJobInfo({
          customer: d.customer || '', job_address: d.job_address || '', tower_owner: d.tower_owner || '',
          check_in_time: d.check_in_time || '', check_out_time: d.check_out_time || '',
        })
        setContacts({
          hospital_name: d.hospital_name || '', hospital_address: d.hospital_address || '', hospital_phone: d.hospital_phone || '',
          fire_dept_name: d.fire_dept_name || '', fire_dept_phone: d.fire_dept_phone || '',
          police_dept_name: d.police_dept_name || '', police_dept_phone: d.police_dept_phone || '',
          sheriff_dept_name: d.sheriff_dept_name || '', sheriff_dept_phone: d.sheriff_dept_phone || '',
        })
        setLive({
          site_lat: d.site_lat, site_lng: d.site_lng,
          weather: d.weather, weather_fetched_at: d.weather_fetched_at, driving_directions: d.driving_directions,
        })
        setRescuePlan({
          cell_coverage: d.cell_coverage, first_aid_kit_onsite: d.first_aid_kit_onsite,
          fire_extinguisher_onsite: d.fire_extinguisher_onsite, safety_banner_posted: d.safety_banner_posted,
          crew_trained_for_rescue: d.crew_trained_for_rescue, rescue_plan_text: d.rescue_plan_text || '',
        })
        setToolsEquipment({
          tools_tethered: d.tools_tethered, bags_sealed: d.bags_sealed,
          drop_zone_red: d.drop_zone_red, drop_zone_yellow: d.drop_zone_yellow,
        })
        setWorkAreaHazards(d.work_area_hazards || {})
        setEnvironmentalHazards(d.environmental_hazards || {})
        setPpe(d.ppe || {})
        setPfas(d.pfas || {})
        setStructuralRigging({
          structure_type: d.structure_type || '', structure_overloaded: d.structure_overloaded,
          rigging_required: d.rigging_required, rigging_plan_onsite: d.rigging_plan_onsite,
          rigging_plan_reviewed: d.rigging_plan_reviewed,
        })
        setClimbingAccess({
          climbing_access_method: d.climbing_access_method || '',
          safety_climb_used: d.safety_climb_used, safety_climb_inspected: d.safety_climb_inspected,
        })
        setSafetyTasks(d.safety_tasks || [])
        setLastFiveMinutes(d.last_five_minutes || {})
      }
      setLoading(false)
    }
    fetchJSA()
  }, [jobId])

  function toggleHazard(hazard: string) {
    setSelectedHazards(prev =>
      prev.includes(hazard) ? prev.filter(h => h !== hazard) : [...prev, hazard]
    )
  }

  function updateCrewName(index: number, name: string) {
    setCrewSignatures(prev => prev.map((c, i) => i === index ? { ...c, name } : c))
  }

  function saveSignature(index: number, dataUrl: string) {
    setCrewSignatures(prev => prev.map((c, i) =>
      i === index ? { ...c, signature: dataUrl, signed_at: new Date().toISOString() } : c
    ))
    setSignModalIndex(null)
  }

  const validCrewSignatures = crewSignatures.filter(c => c.name.trim() && c.signature)
  const canComplete = validCrewSignatures.length > 0

  async function handleComplete() {
    if (selectedHazards.length === 0) {
      alert('Select at least one hazard before completing the SPA.')
      return
    }
    if (!canComplete) {
      alert('At least one crew member must enter their name and draw a signature.')
      return
    }
    if (safetyTasks.length === 0) {
      alert('Select at least one safety task for the day.')
      return
    }
    setSaving(true)
    const payload = {
      job_id: jobId,
      hazards: selectedHazards,
      notes,
      crew_signatures: validCrewSignatures,
      completed_at: new Date().toISOString(),
      ...jobInfo,
      ...contacts,
      site_lat: live.site_lat,
      site_lng: live.site_lng,
      weather: live.weather,
      weather_fetched_at: live.weather_fetched_at,
      driving_directions: live.driving_directions,
      ...rescuePlan,
      ...toolsEquipment,
      work_area_hazards: workAreaHazards,
      environmental_hazards: environmentalHazards,
      ppe,
      pfas,
      ...structuralRigging,
      ...climbingAccess,
      safety_tasks: safetyTasks,
      last_five_minutes: lastFiveMinutes,
    }
    const { data, error } = jsa
      ? await supabase.from('jsa').update(payload).eq('id', jsa.id).select().single()
      : await supabase.from('jsa').insert([payload]).select().single()
    if (error) console.error(error)
    else setJsa(data as JSA)
    setSaving(false)
  }

  async function handleSendPdf(targetJsa: JSA) {
    if (!job) return
    setSendingPdf(true)
    setEmailStatus('Sending PDF to PMs...')
    try {
      const result = await generateAndSendSpaPdf(job, targetJsa)
      setEmailStatus(`PDF sent to ${result.sent} PM${result.sent === 1 ? '' : 's'}.`)
    } catch (err) {
      setEmailStatus(`Failed to email PDF: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
    setSendingPdf(false)
  }

  async function handleApproveJSA() {
    if (!jsa) return
    setApprovingJSA(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('jsa')
      .update({
        jsa_approved:    true,
        jsa_approved_at: new Date().toISOString(),
        jsa_approved_by: user?.id,
      })
      .eq('id', jsa.id)
      .select()
      .single()
    if (!error && data) {
      const updated = data as JSA
      setJsa(updated)
      await handleSendPdf(updated)
    }
    setApprovingJSA(false)
  }

  if (loading) return <div style={{ padding: 16, fontSize: 13, color: '#888' }}>Loading SPA...</div>

  const isCompleted = !!jsa?.completed_at
  const isApproved  = !!jsa?.jsa_approved

  return (
    <div>
      <div style={{ backgroundColor: '#fff', borderRadius: 10,
        padding: `24px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 12, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
          Daily Safe Plan of Action (SPA)
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isCompleted && (
            <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px',
              borderRadius: 20, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
              ✓ Completed {new Date(jsa!.completed_at!).toLocaleDateString()}
            </span>
          )}
          {isApproved && (
            <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px',
              borderRadius: 20, backgroundColor: '#e3f2fd', color: '#1565c0' }}>
              ✓ SM Approved {new Date(jsa!.jsa_approved_at!).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <JobInfoSection value={jobInfo} onChange={setJobInfo} disabled={isCompleted} />

      <EmergencyContactsSection contacts={contacts} onContactsChange={setContacts}
        live={live} onLiveChange={setLive} disabled={isCompleted} />

      <RescuePlanSection value={rescuePlan} onChange={setRescuePlan} disabled={isCompleted} />

      <ToolsEquipmentSection value={toolsEquipment} onChange={setToolsEquipment} disabled={isCompleted} />

      <WorkAreaHazardsSection value={workAreaHazards} onChange={setWorkAreaHazards} disabled={isCompleted} />

      <EnvironmentalHazardsSection value={environmentalHazards} onChange={setEnvironmentalHazards} disabled={isCompleted} />

      <PPESection value={ppe} onChange={setPpe} disabled={isCompleted} />

      <PFASSection value={pfas} onChange={setPfas} disabled={isCompleted} />

      <StructuralRiggingSection value={structuralRigging} onChange={setStructuralRigging} disabled={isCompleted} />

      <ClimbingAccessSection value={climbingAccess} onChange={setClimbingAccess} disabled={isCompleted} />

      <SafetyTasksSection value={safetyTasks} onChange={setSafetyTasks} disabled={isCompleted} />

      <Section title="Identified Hazards & Notes" defaultOpen>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Identified Hazards
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HAZARDS.map(hazard => (
              <label key={hazard}
                style={{ display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, color: '#1a1a1a',
                  cursor: isCompleted ? 'default' : 'pointer' }}>
                <input type="checkbox"
                  checked={selectedHazards.includes(hazard)}
                  onChange={() => !isCompleted && toggleHazard(hazard)}
                  disabled={isCompleted}
                  style={{ width: 15, height: 15, cursor: isCompleted ? 'default' : 'pointer' }} />
                {hazard}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Additional Notes / Control Measures
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            disabled={isCompleted}
            placeholder="Describe control measures for identified hazards..."
            rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e0e0e0', fontSize: 13, resize: 'vertical',
              fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
              backgroundColor: isCompleted ? '#fafafa' : '#fff', color: '#1a1a1a' }} />
        </div>
      </Section>

      <LastFiveMinutesSection value={lastFiveMinutes} onChange={setLastFiveMinutes} disabled={isCompleted} />

      <div style={{ backgroundColor: '#fff', borderRadius: 10,
        padding: `24px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Crew Signatures
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {crewSignatures.map((crew, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={crew.name} onChange={e => updateCrewName(i, e.target.value)}
                  disabled={isCompleted}
                  placeholder={`Crew member ${i + 1} name`}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e0e0e0', fontSize: 13,
                    backgroundColor: isCompleted ? '#fafafa' : '#fff', color: '#1a1a1a' }} />
                {!isCompleted && (
                  <button onClick={() => setSignModalIndex(i)}
                    style={{ padding: '8px 14px', borderRadius: 8,
                      border: `1px solid ${crew.signature ? '#2e7d32' : '#1565c0'}`,
                      backgroundColor: 'transparent',
                      color: crew.signature ? '#2e7d32' : '#1565c0', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {crew.signature ? '✓ Signed' : 'Sign'}
                  </button>
                )}
                {!isCompleted && crewSignatures.length > 1 && (
                  <button onClick={() => setCrewSignatures(crewSignatures.filter((_, j) => j !== i))}
                    style={{ padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #e0c9c9', backgroundColor: 'transparent',
                      color: '#c62828', fontSize: 13, cursor: 'pointer' }}>
                    ×
                  </button>
                )}
              </div>
              {crew.signature && (
                <img src={crew.signature} alt={`${crew.name || 'Crew member'} signature`}
                  style={{ height: 50, width: 'auto', alignSelf: 'flex-start',
                    border: '1px solid #e0e0e0', borderRadius: 6, backgroundColor: '#fff' }} />
              )}
            </div>
          ))}
          {!isCompleted && (
            <button onClick={() => setCrewSignatures([...crewSignatures, { name: '', signature: null, signed_at: null }])}
              style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 8,
                border: '1px solid #e0e0e0', backgroundColor: 'transparent',
                fontSize: 13, color: '#666', cursor: 'pointer' }}>
              + Add crew member
            </button>
          )}
        </div>

        {!isCompleted && (
          <button onClick={handleComplete} disabled={saving || !canComplete}
            title={!canComplete ? 'At least one crew member must enter their name and draw a signature' : ''}
            style={{ width: '100%', backgroundColor: canComplete ? '#2e7d32' : '#ccc', color: '#fff',
              border: 'none', borderRadius: 8, padding: 12,
              fontSize: 14, fontWeight: 500, cursor: (saving || !canComplete) ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '✓ Complete SPA — Ready to Work'}
          </button>
        )}

        {role === 'safety_manager' && isCompleted && !isApproved && (
          <button onClick={handleApproveJSA} disabled={approvingJSA}
            style={{ width: '100%', marginTop: 10,
              backgroundColor: '#1565c0', color: '#fff',
              border: 'none', borderRadius: 8, padding: 12,
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              opacity: approvingJSA ? 0.7 : 1 }}>
            {approvingJSA ? 'Approving...' : '✓ Approve SPA'}
          </button>
        )}
        {(role === 'safety_manager' || role === 'pm') && isApproved && jsa && (
          <button onClick={() => handleSendPdf(jsa)} disabled={sendingPdf}
            style={{ width: '100%', marginTop: 10,
              backgroundColor: '#fff', color: '#1565c0', border: '1px solid #1565c0',
              borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 500,
              cursor: sendingPdf ? 'wait' : 'pointer', opacity: sendingPdf ? 0.7 : 1 }}>
            {sendingPdf ? 'Sending...' : '↻ Resend PDF to PMs'}
          </button>
        )}
        {emailStatus && (
          <p style={{ fontSize: 12, color: emailStatus.startsWith('Failed') || emailStatus.startsWith('Approved, but') ? '#c62828' : '#888', marginTop: 8 }}>
            {emailStatus}
          </p>
        )}
      </div>

      {signModalIndex !== null && (
        <SignatureModal
          name={crewSignatures[signModalIndex].name}
          onSave={dataUrl => saveSignature(signModalIndex, dataUrl)}
          onClose={() => setSignModalIndex(null)}
        />
      )}
    </div>
  )
}
