import { useState } from 'react'
import { Section } from './Section'
import { fetchWeather, geocodeAddress, fetchDrivingDirections, type WeatherSummary, type DrivingDirections } from '../../lib/weatherAndDirections'

const inputStyle = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, color: '#1a1a1a', backgroundColor: '#fff' }

export interface EmergencyContacts {
  hospital_name: string
  hospital_address: string
  hospital_phone: string
  fire_dept_name: string
  fire_dept_phone: string
  police_dept_name: string
  police_dept_phone: string
  sheriff_dept_name: string
  sheriff_dept_phone: string
}

export interface LiveConditions {
  site_lat: number | null
  site_lng: number | null
  weather: WeatherSummary | null
  weather_fetched_at: string | null
  driving_directions: DrivingDirections | null
}

interface Props {
  contacts: EmergencyContacts
  onContactsChange: (value: EmergencyContacts) => void
  live: LiveConditions
  onLiveChange: (value: LiveConditions) => void
  disabled?: boolean
}

function ContactFields({ label, name, address, phone, onName, onAddress, onPhone, disabled }: {
  label: string; name: string; address?: string; phone: string
  onName: (v: string) => void; onAddress?: (v: string) => void; onPhone: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input placeholder="Name" value={name} disabled={disabled} onChange={e => onName(e.target.value)}
          style={{ ...inputStyle, boxSizing: 'border-box' }} />
        {onAddress && (
          <input placeholder="Address" value={address} disabled={disabled} onChange={e => onAddress(e.target.value)}
            style={{ ...inputStyle, boxSizing: 'border-box' }} />
        )}
        <input placeholder="Phone" value={phone} disabled={disabled} onChange={e => onPhone(e.target.value)}
          style={{ ...inputStyle, boxSizing: 'border-box' }} />
      </div>
    </div>
  )
}

export function EmergencyContactsSection({ contacts, onContactsChange, live, onLiveChange, disabled }: Props) {
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  function setContact<K extends keyof EmergencyContacts>(key: K, v: EmergencyContacts[K]) {
    onContactsChange({ ...contacts, [key]: v })
  }

  async function handleRefresh() {
    setRefreshing(true)
    setError('')
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true })
      )
      const siteLat = pos.coords.latitude
      const siteLng = pos.coords.longitude

      const weather = await fetchWeather(siteLat, siteLng)

      let drivingDirections: DrivingDirections | null = null
      if (contacts.hospital_address.trim()) {
        const hospitalCoords = await geocodeAddress(contacts.hospital_address)
        if (hospitalCoords) {
          drivingDirections = await fetchDrivingDirections(siteLat, siteLng, hospitalCoords.lat, hospitalCoords.lng)
        }
      }

      onLiveChange({
        site_lat: siteLat, site_lng: siteLng,
        weather, weather_fetched_at: new Date().toISOString(),
        driving_directions: drivingDirections,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh conditions')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Section title="Emergency Locations & Conditions">
      <ContactFields label="Hospital" name={contacts.hospital_name} address={contacts.hospital_address}
        phone={contacts.hospital_phone} disabled={disabled}
        onName={v => setContact('hospital_name', v)} onAddress={v => setContact('hospital_address', v)}
        onPhone={v => setContact('hospital_phone', v)} />
      <ContactFields label="Fire Department" name={contacts.fire_dept_name} phone={contacts.fire_dept_phone}
        disabled={disabled} onName={v => setContact('fire_dept_name', v)} onPhone={v => setContact('fire_dept_phone', v)} />
      <ContactFields label="Police Department" name={contacts.police_dept_name} phone={contacts.police_dept_phone}
        disabled={disabled} onName={v => setContact('police_dept_name', v)} onPhone={v => setContact('police_dept_phone', v)} />
      <ContactFields label="Sheriff Department" name={contacts.sheriff_dept_name} phone={contacts.sheriff_dept_phone}
        disabled={disabled} onName={v => setContact('sheriff_dept_name', v)} onPhone={v => setContact('sheriff_dept_phone', v)} />

      {!disabled && (
        <button onClick={handleRefresh} disabled={refreshing} style={{
          width: '100%', backgroundColor: '#1565c0', color: '#fff', border: 'none',
          borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 500,
          cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.7 : 1, marginTop: 4 }}>
          {refreshing ? 'Fetching live weather & directions...' : '↻ Refresh Conditions (weather + directions to hospital)'}
        </button>
      )}
      {error && <p style={{ fontSize: 12, color: '#c62828', marginTop: 8 }}>{error}</p>}

      {live.weather && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Weather conditions at site</div>
          <div>{live.weather.conditions} · {live.weather.temperatureF}°F · wind {live.weather.windMph} mph</div>
          {live.weather_fetched_at && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              as of {new Date(live.weather_fetched_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {live.driving_directions && (
        <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Directions to Hospital — {live.driving_directions.distanceMiles} mi
          </div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {live.driving_directions.steps.map((step, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </Section>
  )
}
