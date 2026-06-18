// Free, no-API-key data sources for the SPA's live weather + driving directions.
// OSRM's public demo router and Nominatim's public geocoder are best-effort,
// rate-limited services — fine for this app's volume, not a production SLA.

const WMO_CONDITIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Light rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
}

export interface WeatherSummary {
  temperatureF: number
  windMph: number
  conditions: string
  fetchedAt: string
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherSummary> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather fetch failed: ${res.status}`)
  const data = await res.json()
  const cw = data.current_weather
  return {
    temperatureF: Math.round(cw.temperature * 9 / 5 + 32),
    windMph: Math.round(cw.windspeed * 0.621371),
    conditions: WMO_CONDITIONS[cw.weathercode] ?? `Code ${cw.weathercode}`,
    fetchedAt: new Date().toISOString(),
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`geocode fetch failed: ${res.status}`)
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

export interface DrivingDirections {
  distanceMiles: number
  steps: string[]
}

function describeStep(step: { maneuver: { type: string; modifier?: string }; name: string; distance: number }): string {
  const { type, modifier } = step.maneuver
  const miles = (step.distance * 0.000621371).toFixed(1)
  const named = step.name ? ` onto ${step.name}` : ''
  let action: string
  if (type === 'depart') action = `Head${modifier ? ` ${modifier}` : ''} toward${named || ' destination'}`
  else if (type === 'arrive') return 'Arrive at destination'
  else action = `${type.charAt(0).toUpperCase()}${type.slice(1)}${modifier ? ` ${modifier}` : ''}${named}`
  return `${action} (${miles} mi)`
}

export async function fetchDrivingDirections(
  fromLat: number, fromLng: number, toLat: number, toLng: number
): Promise<DrivingDirections> {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?steps=true&overview=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`directions fetch failed: ${res.status}`)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('no route found')
  const leg = data.routes[0].legs[0]
  return {
    distanceMiles: Math.round(data.routes[0].distance * 0.000621371 * 10) / 10,
    steps: leg.steps.map(describeStep),
  }
}
