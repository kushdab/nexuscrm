'use client'
import { useState, useCallback, useEffect } from 'react'
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const API = process.env.NEXT_PUBLIC_API_URL || ''

// ── Coordinate lookup ──────────────────────────────────────────────────────────
// US states (full name or abbreviation) → [lng, lat]
const US_STATES: Record<string, [number, number]> = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA',
  'kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD',
  'massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO',
  'montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ',
  'new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH',
  'oklahoma':'OK','oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC',
  'south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT',
  'virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY',
  'dc':'DC','district of columbia':'DC',
} as any

const STATE_COORDS: Record<string, [number, number]> = {
  AL:[-86.7911,32.7990],AK:[-153.3691,66.1605],AZ:[-111.4312,34.2744],
  AR:[-92.4426,34.8938],CA:[-119.4179,36.7783],CO:[-105.5478,38.9972],
  CT:[-72.7273,41.6219],DE:[-75.5277,38.9896],FL:[-81.5158,27.7663],
  GA:[-83.4426,32.1656],HI:[-155.5828,19.8968],ID:[-114.7420,44.3509],
  IL:[-88.9862,40.3495],IN:[-86.2583,39.8494],IA:[-93.2105,42.0046],
  KS:[-98.4842,38.5266],KY:[-84.2700,37.6681],LA:[-91.9623,31.1695],
  ME:[-69.3819,44.6939],MD:[-76.8021,39.0639],MA:[-71.5301,42.2302],
  MI:[-84.5361,43.3266],MN:[-93.9002,45.6945],MS:[-89.6787,32.7416],
  MO:[-92.2884,38.4561],MT:[-110.3626,46.8797],NE:[-99.9018,41.4925],
  NV:[-117.0554,38.3135],NH:[-71.5639,43.1939],NJ:[-74.4057,40.2989],
  NM:[-106.2371,34.5400],NY:[-74.9481,42.1657],NC:[-79.8060,35.6301],
  ND:[-99.7840,47.5289],OH:[-82.9071,40.4173],OK:[-96.9247,35.5653],
  OR:[-120.5583,44.5720],PA:[-77.2098,40.5908],RI:[-71.5118,41.6809],
  SC:[-80.9450,33.8569],SD:[-99.4388,44.2998],TN:[-86.6923,35.7478],
  TX:[-97.5635,31.0545],UT:[-111.0937,39.3210],VT:[-72.7107,44.0459],
  VA:[-78.6569,37.7693],WA:[-120.5015,47.4009],WV:[-80.4549,38.4912],
  WI:[-89.6165,44.2685],WY:[-107.2903,42.7560],DC:[-77.0369,38.9072],
}

// World country name → [lng, lat] (capitals / centroids)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'united states':[-98.5795,39.8282],'usa':[-98.5795,39.8282],'us':[-98.5795,39.8282],
  'canada':[-96.8165,56.1304],'mexico':[-102.5528,23.6345],
  'united kingdom':[-3.4360,55.3781],'uk':[-3.4360,55.3781],'england':[-1.1743,52.3555],
  'germany':[10.4515,51.1657],'france':[2.2137,46.2276],'italy':[12.5674,41.8719],
  'spain':[-3.7038,40.4168],'netherlands':[5.2913,52.1326],'switzerland':[8.2275,46.8182],
  'sweden':[18.6435,60.1282],'norway':[8.4689,60.4720],'denmark':[9.5018,56.2639],
  'poland':[19.1451,51.9194],'ukraine':[31.1656,48.3794],
  'australia':[133.7751,-25.2744],'new zealand':[174.8860,-40.9006],
  'japan':[138.2529,36.2048],'china':[104.1954,35.8617],'india':[78.9629,20.5937],
  'south korea':[127.7669,35.9078],'singapore':[103.8198,1.3521],
  'brazil':[-51.9253,-14.2350],'argentina':[-63.6167,-38.4161],'colombia':[-74.2973,4.5709],
  'south africa':[25.0820,-29.0000],'nigeria':[8.6753,9.0820],'kenya':[37.9062,-0.0236],
  'ghana':[-1.0232,7.9465],'ethiopia':[40.4897,9.1450],'egypt':[30.8025,26.8206],
  'uae':[53.8478,23.4241],'saudi arabia':[45.0792,23.8859],'israel':[34.8516,31.0461],
  'turkey':[35.2433,38.9637],'russia':[105.3188,61.5240],
}

interface LocationPoint {
  key: string
  coordinates: [number, number]
  count: number
  label: string
}

interface MoveEndArgs { coordinates: [number, number]; zoom: number }

function resolveCoords(state?: string, country?: string): [number, number] | null {
  if (state) {
    const s = state.trim()
    // Try direct abbreviation
    if (STATE_COORDS[s.toUpperCase()]) return STATE_COORDS[s.toUpperCase()]
    // Try full name → abbreviation
    const abbr = US_STATES[s.toLowerCase()]
    if (abbr && STATE_COORDS[abbr]) return STATE_COORDS[abbr]
  }
  if (country) {
    const c = country.trim().toLowerCase()
    if (COUNTRY_COORDS[c]) return COUNTRY_COORDS[c]
    // partial match
    for (const k of Object.keys(COUNTRY_COORDS)) {
      if (c.includes(k) || k.includes(c)) return COUNTRY_COORDS[k]
    }
  }
  return null
}

export default function ClientWorldMap() {
  const [zoom, setZoom]   = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 20])
  const [tooltip, setTooltip] = useState<{ label: string; count: number } | null>(null)
  const [points, setPoints] = useState<LocationPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { setLoading(false); return }
    fetch(`${API}/api/v1/contacts/locations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: { state?: string; country?: string; count: number }[]) => {
        const map = new Map<string, LocationPoint>()
        for (const row of data) {
          const coords = resolveCoords(row.state, row.country)
          if (!coords) continue
          const key = coords.join(',')
          const label = [row.state, row.country].filter(Boolean).join(', ')
          if (map.has(key)) {
            const p = map.get(key)!
            p.count += row.count
          } else {
            map.set(key, { key, coordinates: coords, count: row.count, label })
          }
        }
        const pts = Array.from(map.values())
        setPoints(pts.length ? pts : [{ key:'default', coordinates:[-111.0937,39.3210], count:0, label:'Salt Lake City, UT' }])
      })
      .catch(() => setPoints([{ key:'default', coordinates:[-111.0937,39.3210], count:0, label:'Salt Lake City, UT' }]))
      .finally(() => setLoading(false))
  }, [])

  const handleMoveEnd = useCallback(({ coordinates, zoom }: MoveEndArgs) => {
    setCenter(coordinates); setZoom(zoom)
  }, [])

  const totalClients = points.reduce((s, p) => s + p.count, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Customer Locations</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${points.length} region${points.length!==1?'s':''} · ${totalClients} customer${totalClients!==1?'s':''}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={()=>setZoom(z=>Math.min(z*1.5,12))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors text-lg font-bold">+</button>
          <button onClick={()=>setZoom(z=>Math.max(z/1.5,1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors text-lg font-bold">−</button>
          <button onClick={()=>{ setZoom(1); setCenter([0,20]) }}
            className="px-3 h-8 flex items-center rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">Reset</button>
        </div>
      </div>

      <div className="relative bg-[#e8f0f7]" style={{ height: 340 }}>
        <ComposableMap projection="geoMercator"
          projectionConfig={{ scale: 140, center: [0, 20] }}
          style={{ width:'100%', height:'100%' }}>
          <ZoomableGroup zoom={zoom} center={center} onMoveEnd={handleMoveEnd} minZoom={0.8} maxZoom={12}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) => geographies.map(geo => (
                <Geography key={geo.rsmKey} geography={geo}
                  fill="#d1dce8" stroke="#b8c8d9" strokeWidth={0.4}
                  style={{ default:{outline:'none'}, hover:{fill:'#b8cde0',outline:'none'}, pressed:{outline:'none'} }} />
              ))}
            </Geographies>

            {points.map(loc => (
              <Marker key={loc.key} coordinates={loc.coordinates}
                onMouseEnter={() => setTooltip({ label: loc.label, count: loc.count })}
                onMouseLeave={() => setTooltip(null)}>
                <circle r={14/zoom} fill="#ef4444" fillOpacity={0.15} stroke="none" />
                <circle r={7/zoom} fill="#ef4444" stroke="#ffffff" strokeWidth={2/zoom} style={{ cursor:'pointer' }} />
                <text textAnchor="middle" y={-(13/zoom)}
                  style={{ fontSize: Math.max(9,11/zoom), fontWeight:700, fill:'#111827',
                    pointerEvents:'none', textShadow:'0 1px 2px rgba(255,255,255,0.9)' }}>
                  {loc.label.split(',')[0]}
                </text>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 pointer-events-none">
            <p className="text-sm font-semibold text-gray-800">{tooltip.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{tooltip.count} customer{tooltip.count!==1?'s':''}</p>
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200">
          <p className="text-xs text-gray-400">Scroll or pinch to zoom · Drag to pan</p>
        </div>
      </div>

      {points.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
          {points.slice(0,8).map(loc => (
            <div key={loc.key} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">{loc.label}</span>
              {loc.count > 0 && (
                <span className="text-xs bg-red-50 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">{loc.count}</span>
              )}
            </div>
          ))}
          {points.length > 8 && <span className="text-xs text-gray-400">+{points.length-8} more</span>}
        </div>
      )}
    </div>
  )
}
