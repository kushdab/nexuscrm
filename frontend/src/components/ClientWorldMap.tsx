'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps'
import { ZoomableGroup } from 'react-simple-maps'

const US_COUNTIES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json'
const US_STATES_URL   = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const API = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : ''

interface LocationPoint {
  city: string; state: string; country: string; count: number
  coords: [number, number] | null
}

// US state abbreviation/name → [lon, lat]
const STATE_COORDS: Record<string,[number,number]> = {
  'AL':[-86.8,32.8],'AK':[-153.4,61.4],'AZ':[-111.1,34.0],'AR':[-92.4,34.9],
  'CA':[-119.7,36.1],'CO':[-105.5,39.0],'CT':[-72.7,41.6],'DE':[-75.5,39.0],
  'FL':[-81.5,27.8],'GA':[-83.4,32.6],'HI':[-157.5,20.3],'ID':[-114.5,43.7],
  'IL':[-89.0,40.4],'IN':[-86.3,39.9],'IA':[-93.2,42.0],'KS':[-98.4,38.5],
  'KY':[-84.3,37.7],'LA':[-91.9,31.2],'ME':[-69.4,44.7],'MD':[-76.8,39.1],
  'MA':[-71.5,42.2],'MI':[-85.4,44.2],'MN':[-93.9,46.4],'MS':[-89.7,32.7],
  'MO':[-92.3,38.5],'MT':[-110.5,47.1],'NE':[-99.9,41.5],'NV':[-116.9,38.5],
  'NH':[-71.6,43.2],'NJ':[-74.7,40.1],'NM':[-106.1,34.5],'NY':[-75.0,42.2],
  'NC':[-79.4,35.6],'ND':[-99.8,47.5],'OH':[-82.8,40.4],'OK':[-97.5,35.5],
  'OR':[-120.5,43.9],'PA':[-77.2,40.6],'RI':[-71.5,41.7],'SC':[-80.9,33.9],
  'SD':[-99.9,44.4],'TN':[-86.4,35.8],'TX':[-99.3,31.1],'UT':[-111.1,39.3],
  'VT':[-72.7,44.1],'VA':[-78.2,37.8],'WA':[-120.7,47.4],'WV':[-80.6,38.6],
  'WI':[-89.8,44.3],'WY':[-107.6,43.0],
  'ALABAMA':[-86.8,32.8],'ALASKA':[-153.4,61.4],'ARIZONA':[-111.1,34.0],'ARKANSAS':[-92.4,34.9],
  'CALIFORNIA':[-119.7,36.1],'COLORADO':[-105.5,39.0],'CONNECTICUT':[-72.7,41.6],'DELAWARE':[-75.5,39.0],
  'FLORIDA':[-81.5,27.8],'GEORGIA':[-83.4,32.6],'HAWAII':[-157.5,20.3],'IDAHO':[-114.5,43.7],
  'ILLINOIS':[-89.0,40.4],'INDIANA':[-86.3,39.9],'IOWA':[-93.2,42.0],'KANSAS':[-98.4,38.5],
  'KENTUCKY':[-84.3,37.7],'LOUISIANA':[-91.9,31.2],'MAINE':[-69.4,44.7],'MARYLAND':[-76.8,39.1],
  'MASSACHUSETTS':[-71.5,42.2],'MICHIGAN':[-85.4,44.2],'MINNESOTA':[-93.9,46.4],'MISSISSIPPI':[-89.7,32.7],
  'MISSOURI':[-92.3,38.5],'MONTANA':[-110.5,47.1],'NEBRASKA':[-99.9,41.5],'NEVADA':[-116.9,38.5],
  'NEW HAMPSHIRE':[-71.6,43.2],'NEW JERSEY':[-74.7,40.1],'NEW MEXICO':[-106.1,34.5],'NEW YORK':[-75.0,42.2],
  'NORTH CAROLINA':[-79.4,35.6],'NORTH DAKOTA':[-99.8,47.5],'OHIO':[-82.8,40.4],'OKLAHOMA':[-97.5,35.5],
  'OREGON':[-120.5,43.9],'PENNSYLVANIA':[-77.2,40.6],'RHODE ISLAND':[-71.5,41.7],'SOUTH CAROLINA':[-80.9,33.9],
  'SOUTH DAKOTA':[-99.9,44.4],'TENNESSEE':[-86.4,35.8],'TEXAS':[-99.3,31.1],'UTAH':[-111.1,39.3],
  'VERMONT':[-72.7,44.1],'VIRGINIA':[-78.2,37.8],'WASHINGTON':[-120.7,47.4],'WEST VIRGINIA':[-80.6,38.6],
  'WISCONSIN':[-89.8,44.3],'WYOMING':[-107.6,43.0],
}
const CITY_COORDS: Record<string,[number,number]> = {
  'SALT LAKE CITY':[-111.9,40.8],'LOS ANGELES':[-118.2,34.1],'NEW YORK':[-74.0,40.7],
  'CHICAGO':[-87.6,41.9],'HOUSTON':[-95.4,29.8],'PHOENIX':[-112.1,33.5],'PHILADELPHIA':[-75.2,40.0],
  'SAN ANTONIO':[-98.5,29.4],'SAN DIEGO':[-117.2,32.7],'DALLAS':[-96.8,32.8],'SAN JOSE':[-121.9,37.3],
  'AUSTIN':[-97.7,30.3],'JACKSONVILLE':[-81.7,30.3],'FORT WORTH':[-97.3,32.8],'COLUMBUS':[-83.0,40.0],
  'SAN FRANCISCO':[-122.4,37.8],'CHARLOTTE':[-80.8,35.2],'INDIANAPOLIS':[-86.2,39.8],
  'SEATTLE':[-122.3,47.6],'DENVER':[-105.0,39.7],'NASHVILLE':[-86.8,36.2],'OKLAHOMA CITY':[-97.5,35.5],
  'EL PASO':[-106.5,31.8],'BOSTON':[-71.1,42.4],'PORTLAND':[-122.7,45.5],'LAS VEGAS':[-115.1,36.2],
  'MEMPHIS':[-90.0,35.1],'LOUISVILLE':[-85.8,38.3],'BALTIMORE':[-76.6,39.3],'MILWAUKEE':[-87.9,43.0],
  'ALBUQUERQUE':[-106.7,35.1],'TUCSON':[-111.0,32.2],'FRESNO':[-119.8,36.7],'SACRAMENTO':[-121.5,38.6],
  'MESA':[-111.8,33.4],'KANSAS CITY':[-94.6,39.1],'ATLANTA':[-84.4,33.8],'MIAMI':[-80.2,25.8],
  'RALEIGH':[-78.6,35.8],'COLORADO SPRINGS':[-104.8,38.8],'MINNEAPOLIS':[-93.3,45.0],
  'TAMPA':[-82.5,28.0],'WICHITA':[-97.3,37.7],'ST LOUIS':[-90.2,38.6],'PITTSBURGH':[-80.0,40.4],
  'CINCINNATI':[-84.5,39.1],'GREENSBORO':[-79.8,36.1],'ANCHORAGE':[-149.9,61.2],
  'PROVO':[-111.7,40.2],'OGDEN':[-111.97,41.22],'ST GEORGE':[-113.6,37.1],
}

async function geocodeCity(city: string, state: string): Promise<[number,number]|null> {
  try {
    const q = [city, state, 'USA'].filter(Boolean).join(', ')
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=us`
    const r = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    if (!r.ok) return null
    const d = await r.json()
    if (d.length > 0) return [parseFloat(d[0].lon), parseFloat(d[0].lat)]
  } catch { /* ignore */ }
  return null
}

function resolveCoords(city: string, state: string): [number,number] | null {
  const ck = city?.toUpperCase().trim()
  const sk = state?.toUpperCase().trim()
  if (ck && CITY_COORDS[ck]) return CITY_COORDS[ck]
  if (sk && STATE_COORDS[sk]) return STATE_COORDS[sk]
  return null
}

interface MoveEndArgs { coordinates: [number,number]; zoom: number }

export default function ClientWorldMap() {
  const [zoom, setZoom]     = useState(1)
  const [center, setCenter] = useState<[number,number]>([-96, 38])
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [tooltip, setTooltip]     = useState<LocationPoint | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { setLoading(false); return }

    fetch(`${API}/api/v1/contacts/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(async d => {
        const raw: { city:string; state:string; country:string; count:number }[] = d.items || []

        // Resolve coordinates: use lookup first, fallback to Nominatim
        const pts: LocationPoint[] = []
        for (const x of raw) {
          const staticCoords = resolveCoords(x.city, x.state)
          if (staticCoords) {
            pts.push({ ...x, coords: staticCoords })
          } else if (x.city || x.state) {
            // Live geocode via Nominatim for unknown cities
            const liveCoords = await geocodeCity(x.city, x.state)
            pts.push({ ...x, coords: liveCoords })
          }
        }
        setLocations(pts.filter(p => p.coords !== null))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleMoveEnd = useCallback(({ coordinates, zoom }: MoveEndArgs) => {
    setCenter(coordinates); setZoom(zoom)
  }, [])

  const zoomIn  = () => setZoom(z => Math.min(z * 1.5, 16))
  const zoomOut = () => setZoom(z => Math.max(z / 1.5, 1))
  const reset   = () => { setZoom(1); setCenter([-96, 38]) }

  const total = locations.reduce((s,l) => s + l.count, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Customer Locations — United States</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Resolving locations…'
              : locations.length === 0
              ? 'No US locations yet — add city & state to customer records'
              : `${locations.length} region${locations.length!==1?'s':''} · ${total} customer${total!==1?'s':''}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={zoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors text-lg font-bold">+</button>
          <button onClick={zoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors text-lg font-bold">−</button>
          <button onClick={reset}
            className="px-3 h-8 flex items-center rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">Reset</button>
        </div>
      </div>

      {/* Map */}
      <div className="relative bg-[#dce8f0]" style={{ height: 380 }}>
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 900, center: [0, 0] }}
          width={900}
          height={380}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={16}
            translateExtent={[[-200, -100],[1100, 580]]}
          >
            {/* County fills */}
            <Geographies geography={US_COUNTIES_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography key={geo.rsmKey} geography={geo}
                    fill="#c8dcea" stroke="#a4c0d4" strokeWidth={0.25}
                    style={{ default:{outline:'none'}, hover:{fill:'#b5cfe0',outline:'none'}, pressed:{outline:'none'} }}
                  />
                ))
              }
            </Geographies>

            {/* State outlines (thicker, on top) */}
            <Geographies geography={US_STATES_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography key={geo.rsmKey+'-s'} geography={geo}
                    fill="transparent" stroke="#5a8eaa" strokeWidth={0.7}
                    style={{ default:{outline:'none'}, hover:{outline:'none'}, pressed:{outline:'none'} }}
                  />
                ))
              }
            </Geographies>

            {/* Customer markers */}
            {locations.map((loc, i) => {
              if (!loc.coords) return null
              const r = Math.max(5, Math.min(14, 5 + loc.count * 0.8)) / zoom
              return (
                <Marker key={i} coordinates={loc.coords}
                  onMouseEnter={() => setTooltip(loc)}
                  onMouseLeave={() => setTooltip(null)}>
                  <circle r={r * 2} fill="#ef4444" fillOpacity={0.15} stroke="none" />
                  <circle r={r} fill="#ef4444" stroke="#fff" strokeWidth={2/zoom} style={{ cursor:'pointer' }} />
                  {loc.count > 1 && (
                    <text textAnchor="middle" y={r*0.38}
                      style={{ fontSize: r*1.1, fontWeight:800, fill:'#fff', pointerEvents:'none' }}>
                      {loc.count}
                    </text>
                  )}
                  {zoom >= 2.5 && (
                    <text textAnchor="middle" y={-(r + 4/zoom)}
                      style={{ fontSize: Math.max(7,10/zoom), fontWeight:700, fill:'#1e3a5f',
                        pointerEvents:'none', textShadow:'0 1px 3px rgba(255,255,255,.95)' }}>
                      {loc.city || loc.state}
                    </text>
                  )}
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 pointer-events-none">
            <p className="text-sm font-semibold text-gray-800">
              {[tooltip.city, tooltip.state].filter(Boolean).join(', ')}
            </p>
            <p className="text-xs text-red-600 font-semibold mt-0.5">
              {tooltip.count} customer{tooltip.count!==1?'s':''}
            </p>
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200">
          <p className="text-xs text-gray-400">Scroll · drag · pinch to navigate</p>
        </div>
      </div>

      {/* Legend */}
      {locations.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
          {locations.slice(0,10).map((loc,i)=>(
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-xs text-gray-600">{[loc.city,loc.state].filter(Boolean).join(', ')}</span>
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">{loc.count}</span>
            </div>
          ))}
          {locations.length > 10 && <span className="text-xs text-gray-400">+{locations.length-10} more</span>}
        </div>
      )}

      {!loading && locations.length === 0 && (
        <div className="px-5 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Add <strong>City</strong> and <strong>State</strong> to customer records to see them on this map</p>
        </div>
      )}
    </div>
  )
}
