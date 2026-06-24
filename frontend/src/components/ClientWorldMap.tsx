'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'

// US counties TopoJSON (includes state + county boundaries)
const US_COUNTIES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json'
// US states TopoJSON (for state outlines on top)
const US_STATES_URL   = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const API = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : ''

interface LocationPoint {
  city: string
  state: string
  country: string
  count: number
  coordinates: [number, number] | null
}

interface MoveEndArgs { coordinates: [number, number]; zoom: number }

// US state name → center coordinates (lon, lat) — AlbersUSA projection
const STATE_COORDS: Record<string,[number,number]> = {
  'AL':[-86.79,32.79],'AK':[-152.40,61.37],'AZ':[-111.09,34.05],'AR':[-92.37,34.90],
  'CA':[-119.68,36.12],'CO':[-105.55,38.99],'CT':[-72.73,41.60],'DE':[-75.50,38.99],
  'FL':[-81.52,27.77],'GA':[-83.44,32.64],'HI':[-157.50,20.25],'ID':[-114.48,43.68],
  'IL':[-88.99,40.35],'IN':[-86.27,39.85],'IA':[-93.21,42.01],'KS':[-98.38,38.53],
  'KY':[-84.27,37.67],'LA':[-91.87,31.17],'ME':[-69.38,44.69],'MD':[-76.80,39.06],
  'MA':[-71.53,42.23],'MI':[-85.44,44.18],'MN':[-93.90,46.39],'MS':[-89.68,32.74],
  'MO':[-92.29,38.46],'MT':[-110.45,47.05],'NE':[-99.90,41.49],'NV':[-116.85,38.50],
  'NH':[-71.57,43.19],'NJ':[-74.67,40.14],'NM':[-106.11,34.52],'NY':[-74.95,42.17],
  'NC':[-79.38,35.63],'ND':[-99.79,47.53],'OH':[-82.76,40.42],'OK':[-97.53,35.47],
  'OR':[-120.54,43.94],'PA':[-77.19,40.59],'RI':[-71.51,41.68],'SC':[-80.90,33.86],
  'SD':[-99.90,44.44],'TN':[-86.36,35.75],'TX':[-99.34,31.05],'UT':[-111.09,39.32],
  'VT':[-72.71,44.05],'VA':[-78.17,37.77],'WA':[-120.74,47.40],'WV':[-80.61,38.64],
  'WI':[-89.82,44.27],'WY':[-107.55,43.00],
  // full names
  'ALABAMA':[-86.79,32.79],'ALASKA':[-152.40,61.37],'ARIZONA':[-111.09,34.05],
  'ARKANSAS':[-92.37,34.90],'CALIFORNIA':[-119.68,36.12],'COLORADO':[-105.55,38.99],
  'CONNECTICUT':[-72.73,41.60],'DELAWARE':[-75.50,38.99],'FLORIDA':[-81.52,27.77],
  'GEORGIA':[-83.44,32.64],'HAWAII':[-157.50,20.25],'IDAHO':[-114.48,43.68],
  'ILLINOIS':[-88.99,40.35],'INDIANA':[-86.27,39.85],'IOWA':[-93.21,42.01],
  'KANSAS':[-98.38,38.53],'KENTUCKY':[-84.27,37.67],'LOUISIANA':[-91.87,31.17],
  'MAINE':[-69.38,44.69],'MARYLAND':[-76.80,39.06],'MASSACHUSETTS':[-71.53,42.23],
  'MICHIGAN':[-85.44,44.18],'MINNESOTA':[-93.90,46.39],'MISSISSIPPI':[-89.68,32.74],
  'MISSOURI':[-92.29,38.46],'MONTANA':[-110.45,47.05],'NEBRASKA':[-99.90,41.49],
  'NEVADA':[-116.85,38.50],'NEW HAMPSHIRE':[-71.57,43.19],'NEW JERSEY':[-74.67,40.14],
  'NEW MEXICO':[-106.11,34.52],'NEW YORK':[-74.95,42.17],'NORTH CAROLINA':[-79.38,35.63],
  'NORTH DAKOTA':[-99.79,47.53],'OHIO':[-82.76,40.42],'OKLAHOMA':[-97.53,35.47],
  'OREGON':[-120.54,43.94],'PENNSYLVANIA':[-77.19,40.59],'RHODE ISLAND':[-71.51,41.68],
  'SOUTH CAROLINA':[-80.90,33.86],'SOUTH DAKOTA':[-99.90,44.44],'TENNESSEE':[-86.36,35.75],
  'TEXAS':[-99.34,31.05],'UTAH':[-111.09,39.32],'VERMONT':[-72.71,44.05],
  'VIRGINIA':[-78.17,37.77],'WASHINGTON':[-120.74,47.40],'WEST VIRGINIA':[-80.61,38.64],
  'WISCONSIN':[-89.82,44.27],'WYOMING':[-107.55,43.00],
}

// Major US cities → coordinates
const CITY_COORDS: Record<string,[number,number]> = {
  'SALT LAKE CITY':[-111.89,40.76],'LOS ANGELES':[-118.24,34.05],'NEW YORK':[-74.01,40.71],
  'CHICAGO':[-87.63,41.85],'HOUSTON':[-95.37,29.76],'PHOENIX':[-112.07,33.45],
  'PHILADELPHIA':[-75.17,39.95],'SAN ANTONIO':[-98.49,29.42],'SAN DIEGO':[-117.16,32.72],
  'DALLAS':[-96.80,32.79],'SAN JOSE':[-121.89,37.34],'AUSTIN':[-97.74,30.27],
  'JACKSONVILLE':[-81.66,30.33],'FORT WORTH':[-97.33,32.75],'COLUMBUS':[-82.99,39.96],
  'SAN FRANCISCO':[-122.42,37.77],'CHARLOTTE':[-80.84,35.23],'INDIANAPOLIS':[-86.16,39.77],
  'SEATTLE':[-122.33,47.61],'DENVER':[-104.99,39.74],'NASHVILLE':[-86.78,36.17],
  'OKLAHOMA CITY':[-97.52,35.47],'EL PASO':[-106.49,31.76],'BOSTON':[-71.06,42.36],
  'PORTLAND':[-122.68,45.52],'LAS VEGAS':[-115.14,36.17],'MEMPHIS':[-90.05,35.15],
  'LOUISVILLE':[-85.76,38.25],'BALTIMORE':[-76.61,39.29],'MILWAUKEE':[-87.91,43.04],
  'ALBUQUERQUE':[-106.65,35.08],'TUCSON':[-110.97,32.22],'FRESNO':[-119.77,36.74],
  'SACRAMENTO':[-121.49,38.58],'MESA':[-111.83,33.42],'KANSAS CITY':[-94.58,39.10],
  'ATLANTA':[-84.39,33.75],'MIAMI':[-80.19,25.77],'OMAHA':[-95.93,41.26],
  'RALEIGH':[-78.64,35.78],'COLORADO SPRINGS':[-104.82,38.83],'MINNEAPOLIS':[-93.27,44.98],
  'WICHITA':[-97.34,37.69],'ARLINGTON':[-97.12,32.74],'TAMPA':[-82.46,27.95],
  'AURORA':[-104.80,39.73],'ANAHEIM':[-117.91,33.84],'SANTA ANA':[-117.87,33.75],
  'CORPUS CHRISTI':[-97.40,27.80],'RIVERSIDE':[-117.40,33.98],'ST LOUIS':[-90.20,38.63],
  'LEXINGTON':[-84.50,38.04],'PITTSBURGH':[-79.99,40.44],'STOCKTON':[-121.29,37.96],
  'ANCHORAGE':[-149.90,61.22],'CINCINNATI':[-84.51,39.10],'GREENSBORO':[-79.79,36.07],
}

function resolveCoords(city: string, state: string): [number,number] | null {
  const cityKey = city?.toUpperCase().trim()
  const stateKey = state?.toUpperCase().trim()
  if (cityKey && CITY_COORDS[cityKey]) return CITY_COORDS[cityKey]
  if (stateKey && STATE_COORDS[stateKey]) return STATE_COORDS[stateKey]
  return null
}

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
      .then(d => {
        const raw: { city:string; state:string; country:string; count:number }[] = d.items || []
        const pts: LocationPoint[] = raw
          .filter(x => x.country?.toUpperCase().includes('US') ||
                       x.country === '' || !x.country ||
                       STATE_COORDS[(x.state||'').toUpperCase().trim()] != null)
          .map(x => ({
            ...x,
            coordinates: resolveCoords(x.city, x.state),
          }))
          .filter(x => x.coordinates !== null)
        setLocations(pts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleMoveEnd = useCallback(({ coordinates, zoom }: MoveEndArgs) => {
    setCenter(coordinates); setZoom(zoom)
  }, [])

  const zoomIn  = () => setZoom(z => Math.min(z * 1.6, 20))
  const zoomOut = () => setZoom(z => Math.max(z / 1.6, 1))
  const reset   = () => { setZoom(1); setCenter([-96, 38]) }

  const totalCustomers = locations.reduce((s, l) => s + l.count, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Customer Locations — United States</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Loading…' : locations.length === 0
              ? 'No US locations yet — add city & state to customer records'
              : `${locations.length} region${locations.length!==1?'s':''} · ${totalCustomers} customer${totalCustomers!==1?'s':''}`}
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
          projectionConfig={{ scale: 880 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={zoom} center={center} onMoveEnd={handleMoveEnd} minZoom={1} maxZoom={20}>

            {/* County boundaries (filled land) */}
            <Geographies geography={US_COUNTIES_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#c8dcea"
                    stroke="#a8c4d8"
                    strokeWidth={0.3}
                    style={{
                      default: { outline: 'none' },
                      hover:   { fill: '#b0cfe0', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* State outlines on top of counties */}
            <Geographies geography={US_STATES_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey + '-state'}
                    geography={geo}
                    fill="transparent"
                    stroke="#6a9bb5"
                    strokeWidth={0.8}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Customer location markers */}
            {locations.map((loc, i) => {
              if (!loc.coordinates) return null
              const r = Math.max(4, Math.min(12, 4 + loc.count)) / zoom
              return (
                <Marker
                  key={i}
                  coordinates={loc.coordinates}
                  onMouseEnter={() => setTooltip(loc)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Pulse ring */}
                  <circle r={r * 2.2} fill="#ef4444" fillOpacity={0.15} stroke="none" />
                  {/* Main dot */}
                  <circle
                    r={r}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={1.5 / zoom}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Count badge (shows when count > 1) */}
                  {loc.count > 1 && zoom >= 1.5 && (
                    <text
                      textAnchor="middle"
                      y={r * 0.4}
                      style={{ fontSize: r * 1.1, fontWeight: 800, fill: '#fff', pointerEvents: 'none' }}
                    >
                      {loc.count}
                    </text>
                  )}
                  {/* City/state label at medium zoom */}
                  {zoom >= 2.5 && (
                    <text
                      textAnchor="middle"
                      y={-(r + 3 / zoom)}
                      style={{
                        fontSize: Math.max(7, 9 / zoom),
                        fontWeight: 700,
                        fill: '#1e3a5f',
                        pointerEvents: 'none',
                        textShadow: '0 1px 3px rgba(255,255,255,.95)',
                      }}
                    >
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
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 pointer-events-none max-w-xs">
            <p className="text-sm font-semibold text-gray-800">
              {[tooltip.city, tooltip.state].filter(Boolean).join(', ')}
            </p>
            {tooltip.country && <p className="text-xs text-gray-400">{tooltip.country}</p>}
            <p className="text-xs text-red-600 font-semibold mt-1">
              {tooltip.count} customer{tooltip.count!==1?'s':''}
            </p>
          </div>
        )}

        {/* Hint */}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200">
          <p className="text-xs text-gray-400">Scroll · drag · pinch to navigate</p>
        </div>
      </div>

      {/* Legend */}
      {locations.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
          {locations.slice(0, 10).map((loc, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-xs text-gray-600">
                {[loc.city, loc.state].filter(Boolean).join(', ')}
              </span>
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                {loc.count}
              </span>
            </div>
          ))}
          {locations.length > 10 && (
            <span className="text-xs text-gray-400">+{locations.length - 10} more</span>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && locations.length === 0 && (
        <div className="px-5 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Add <strong>City</strong> and <strong>State</strong> to customer records to see them plotted here
          </p>
        </div>
      )}
    </div>
  )
}
