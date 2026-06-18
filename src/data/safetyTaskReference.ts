// Static hazard/mitigation reference text per safety task, shown read-only
// when a task is selected on the SPA. Transcribed from a real telecom SPA
// (Tower Climbing, Tower Audit are fully transcribed; others are shorter
// generic placeholders pending real source material).

export interface HazardMeasures {
  hazard: string
  measures: string[]
}

export const SAFETY_TASKS = [
  'Tower Audit',
  'Tower Climbing',
  'Tower Rescue',
  'Crane and Rigging',
  'Install Antennas',
  'RRU\'s',
  'Sector Swap/Removal',
  'Ladder Use and Set Up',
  'Hand and Power Tool Use',
  'General Electrical Work',
  'Confined Space Entry',
  'Aerial Lift Operations and Use',
] as const

export const SAFETY_TASK_REFERENCE: Record<string, HazardMeasures[]> = {
  'Tower Audit': [
    {
      hazard: 'Environmental Hazards',
      measures: [
        'Check local weather forecast prior to shift. Get updates from field or office, if needed.',
        'Adjust schedule to work around inclement weather, when possible.',
        'Constantly assess safe working conditions while on the tower.',
        'Be aware of approaching storms and remember that lightning can travel up to 10 miles ahead of a front.',
        'Drink plenty of fluids during hot weather.',
        'Assess the site for any live hazards such as birds and stinging insects, and use repellent for wasp or other stinging insects.',
      ],
    },
    {
      hazard: 'Structural Failure',
      measures: [
        'Inspect tower for missing/broken members and bolts.',
        'Inspect anchor bolts.',
        'Inspect tower anchors/guy wires, when applicable.',
        'Assure tower is plumb.',
      ],
    },
    {
      hazard: 'Fall Protection Equipment Failure',
      measures: [
        'Inspect ALL equipment before each use.',
        'Remove all failed equipment from service.',
        'Choose correct equipment for job.',
        'Use all equipment per manufacturer\'s design.',
      ],
    },
    {
      hazard: 'Fall Hazards',
      measures: [
        '100% tie off at all times.',
        'Use proper work boot for climbing.',
        'Climb at a steady pace.',
        'Rest at appropriate increments.',
        'Inspect all climbing ladders and surfaces.',
      ],
    },
  ],
  'Tower Climbing': [
    {
      hazard: 'Weather',
      measures: [
        'Check local weather forecast prior to shift. Get updates from field or office, if needed.',
        'Adjust schedule to work around inclement weather, when possible.',
        'Constantly assess safe working conditions while on the tower.',
        'Be aware of approaching storms and remember that lightning can travel up to 10 miles ahead of a front.',
      ],
    },
    {
      hazard: 'Harmful Plants',
      measures: [
        'Check any vines growing on tower structure to avoid poison ivy or poison oak, and other type vines.',
        'Keep Benadryl, or equivalent, in truck.',
      ],
    },
    {
      hazard: 'Insects',
      measures: [
        'Make known to all crew members of any known allergies.',
        'Keep Benadryl, or equivalent, in truck.',
        'Keep insect killer in vehicle.',
        'Inspect work area for nests before entering.',
      ],
    },
    {
      hazard: 'Birds/Animals/Snakes',
      measures: [
        'Inspect tower while climbing for birds, animals or snakes.',
        'Avoid bird droppings and wear proper PPE.',
      ],
    },
    {
      hazard: 'Structural Failure',
      measures: [
        'Inspect tower for missing/broken members and bolts.',
        'Inspect anchor bolts.',
        'Inspect tower anchors/guy wires, when applicable.',
        'Assure tower is plumb.',
      ],
    },
    {
      hazard: 'Fall Protection Equipment Failure',
      measures: [
        'Inspect ALL equipment before each use.',
        'Remove all failed equipment from service.',
        'Choose correct equipment for job.',
        'Use all equipment per manufacturer\'s design.',
      ],
    },
    {
      hazard: 'Fall Hazards',
      measures: [
        '100% tie off at all times.',
        'Continuous fall protection required at all times.',
        'Slings being utilized for PFAS anchorages meet the ANSI Z359 standard.',
        'Fall protection anchorages shall be identified at all work/transition points.',
        'Non-certified fall arrest anchorages shall have an ultimate strength requirement of 5,000 lbs. per employee attached.',
        'Certified anchorage shall have an ultimate strength of 3,600 lbs. per employee attached or at least two times the maximum arresting force.',
        'Use proper work boot for climbing.',
        'Climb at a steady pace.',
        'Rest at appropriate increments.',
        'Inspect all climbing ladders and surfaces.',
        'Inspect safety climbing devices and test safety climbing equipment.',
        'Be aware of all appurtenances.',
        'Maintain 3 point contact while climbing.',
        'Avoid high risk routes while navigating structure.',
        'Inspect anchor points before attaching fall protection equipment.',
        'Install safety ropes when needed.',
        'Use appropriate ladder when necessary to access tower.',
        'Maintain good physical conditioning.',
        'Tying off to an appurtenance does not meet the 5,000 lb requirement.',
      ],
    },
    {
      hazard: 'Safety Climb Devices',
      measures: [
        'Visually inspect the safety climb device prior to climbing.',
        'If the safety climb does not have a placard at the base of the tower and the manufacturer is unknown, the climb system should not be used.',
        'If a known-defective safety climb is found installed on the tower, use alternative means of fall protection if feasible.',
      ],
    },
  ],
}

export function getTaskReference(task: string): HazardMeasures[] {
  return SAFETY_TASK_REFERENCE[task] ?? [
    { hazard: 'General', measures: ['Follow site-specific safety plan and standard PPE/fall-protection requirements for this task.'] },
  ]
}
