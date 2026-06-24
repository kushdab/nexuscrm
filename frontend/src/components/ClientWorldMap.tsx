'use client'
import { useState, useCallback, useEffect } from 'react'
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const API = process.env.NEXT_PUBLIC_API_URL || ''

// ── Coordinate lookup ────────────────────────────────────────────────────────
// US state abbreviations + full names → [lng, lat]
const STATE_COORDS: Record<string, [number, number]> = {
  AL:[-86.79,32.80],AK:[-153.37,64.20],AZ:[-111.09,34.05],AR:[-92.37,34.75],
  CA:[-119.42,36.78],CO:[-105.55,39.11],CT:[-72.75,41.60],DE:[-75.50,39.16],
  FL:[-81.52,27.66],GA:[-83.44,32.16],HI:[-155.65,19.90],ID:[-114.74,44.07],
  IL:[-89.20,40.35],IN:[-86.13,39.85],IA:[-93.10,42.01],KS:[-98.38,38.53],
  KY:[-84.27,37.67],LA:[-91.83,31.17],ME:[-69.44,44.69],MD:[-76.80,39.06],
  MA:[-71.53,42.23],MI:[-84.54,43.33],MN:[-94.67,46.39],MS:[-89.40,32.74],
  MO:[-92.29,38.46],MT:[-110.45,46.88],NE:[-98.27,41.49],NV:[-116.42,38.80],
  NH:[-71.57,43.19],NJ:[-74.67,40.30],NM:[-106.25,34.84],NY:[-74.95,42.17],
  NC:[-79.81,35.63],ND:[-99.78,47.53],OH:[-82.79,40.39],OK:[-97.09,35.57],
  OR:[-120.55,43.93],PA:[-77.19,41.20],RI:[-71.48,41.68],SC:[-80.95,33.86],
  SD:[-99.90,44.37],TN:[-86.69,35.86],TX:[-97.56,31.05],UT:[-111.09,39.32],
  VT:[-72.71,44.05],VA:[-78.66,37.43],WA:[-120.74,47.75],WV:[-80.45,38.49],
  WI:[-89.62,44.27],WY:[-107.55,43.08],DC:[-77.03,38.90],
  // Full names
  ALABAMA:[-86.79,32.80],ALASKA:[-153.37,64.20],ARIZONA:[-111.09,34.05],
  ARKANSAS:[-92.37,34.75],CALIFORNIA:[-119.42,36.78],COLORADO:[-105.55,39.11],
  CONNECTICUT:[-72.75,41.60],DELAWARE:[-75.50,39.16],FLORIDA:[-81.52,27.66],
  GEORGIA:[-83.44,32.16],HAWAII:[-155.65,19.90],IDAHO:[-114.74,44.07],
  ILLINOIS:[-89.20,40.35],INDIANA:[-86.13,39.85],IOWA:[-93.10,42.01],
  KANSAS:[-98.38,38.53],KENTUCKY:[-84.27,37.67],LOUISIANA:[-91.83,31.17],
  MAINE:[-69.44,44.69],MARYLAND:[-76.80,39.06],MASSACHUSETTS:[-71.53,42.23],
  MICHIGAN:[-84.54,43.33],MINNESOTA:[-94.67,46.39],MISSISSIPPI:[-89.40,32.74],
  MISSOURI:[-92.29,38.46],MONTANA:[-110.45,46.88],NEBRASKA:[-98.27,41.49],
  NEVADA:[-116.42,38.80],'NEW HAMPSHIRE':[-71.57,43.19],'NEW JERSEY':[-74.67,40.30],
  'NEW MEXICO':[-106.25,34.84],'NEW YORK':[-74.95,42.17],'NORTH CAROLINA':[-79.81,35.63],
  'NORTH DAKOTA':[-99.78,47.53],OHIO:[-82.79,40.39],OKLAHOMA:[-97.09,35.57],
  OREGON:[-120.55,43.93],PENNSYLVANIA:[-77.19,41.20],'RHODE ISLAND':[-71.48,41.68],
  'SOUTH CAROLINA':[-80.95,33.86],'SOUTH DAKOTA':[-99.90,44.37],TENNESSEE:[-86.69,35.86],
  TEXAS:[-97.56,31.05],UTAH:[-111.09,39.32],VERMONT:[-72.71,44.05],
  VIRGINIA:[-78.66,37.43],WASHINGTON:[-120.74,47.75],'WEST VIRGINIA':[-80.45,38.49],
  WISCONSIN:[-89.62,44.27],WYOMING:[-107.55,43.08],
}

// Country centroids [lng, lat]
const COUNTRY_COORDS: Record<string, [number, number]> = {
  KENYA:[37.90,-1.29],NIGERIA:[8.67,9.08],SOUTHAFRICA:[25.08,-29.00],
  ETHIOPIA:[40.49,9.14],GHANA:[-1.02,7.95],TANZANIA:[34.89,-6.37],
  UGANDA:[32.29,1.37],RWANDA:[29.87,-1.94],SENEGAL:[-14.45,14.50],
  EGYPT:[30.80,26.82],MOROCCO:[-7.09,31.79],ALGERIA:[2.63,28.03],
  LIBYA:[17.23,26.34],TUNISIA:[9.56,33.89],SUDAN:[30.22,12.86],
  UNITEDSTATES:[-98.58,39.83],USA:[-98.58,39.83],CANADA:[-96.80,60.07],
  MEXICO:[-102.55,23.63],BRAZIL:[-47.86,-15.79],ARGENTINA:[-63.62,-38.42],
  COLOMBIA:[-74.30,4.57],CHILE:[-71.54,-35.68],PERU:[-75.01,-9.19],
  UNITEDKINGDOM:[-1.17,52.35],UK:[-1.17,52.35],FRANCE:[2.21,46.23],
  GERMANY:[10.45,51.17],ITALY:[12.57,41.87],SPAIN:[-3.75,40.46],
  PORTUGAL:[-8.22,39.40],NETHERLANDS:[5.29,52.13],BELGIUM:[4.47,50.50],
  SWEDEN:[18.64,60.13],NORWAY:[8.47,60.47],DENMARK:[9.50,56.26],
  FINLAND:[25.75,61.92],SWITZERLAND:[8.23,46.82],AUSTRIA:[14.55,47.52],
  POLAND:[19.14,51.92],UKRAINE:[31.17,48.38],RUSSIA:[105.32,61.52],
  CHINA:[104.20,35.86],JAPAN:[138.25,36.20],INDIA:[78.96,20.59],
  INDONESIA:[113.92,-0.79],PAKISTAN:[69.35,30.38],BANGLADESH:[90.36,23.68],
  VIETNAM:[108.28,14.06],THAILAND:[100.99,15.87],MYANMAR:[95.96,16.87],
  PHILIPPINES:[121.77,12.88],MALAYSIA:[109.70,4.21],SINGAPORE:[103.82,1.35],
  AUSTRALIA:[133.78,-25.27],NEWZEALAND:[172.97,-40.90],
  SAUDIARABIA:[45.08,23.88],UAE:[53.85,23.42],QATAR:[51.18,25.35],
  IRAN:[53.69,32.43],IRAQ:[43.68,33.22],TURKEY:[35.24,38.96],
  ISRAEL:[34.85,31.05],JORDAN:[36.24,30.59],LEBANON:[35.50,33.87],
  SOUTHKOREA:[127.77,35.91],NORTHKOREA:[127.51,40.34],
}

interface LocationRow { city:string|null; state:string|null; country:string|null; count:number }
interface MapPin { label:string; coords:[number,number]; count:number; key:string }

const FALLBACK: MapPin[] = [{ label:'Utah', coords:[-111.09,39.32], count:0, key:'fallback' }]

function resolveCoords(row: LocationRow): [number,number] | null {
  // Try state first (more precise)
  if (row.state) {
    const k = row.state.trim().toUpperCase()
    if (STATE_COORDS[k]) return STATE_COORDS[k]
  }
  // Try country
  if (row.country) {
    const k = row.country.trim().toUpperCase().replace(/\s+/g,'')
    if (COUNTRY_COORDS[k]) return COUNTRY_COORDS[k]
  }
  return null
}

interface MoveEndArgs { coordinates:[number,number]; zoom:number }

export default function ClientWorldMap() {
  const [zoom, setZoom]     = useState(1)
  const [center, setCenter] = useState<[number,number]>([0, 20])
  const [pins, setPins]     = useState<MapPin[]>(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ label:string; count:number } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { setLoading(false); return }
    fetch(`${API}/api/v1/contacts/locations`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((rows: LocationRow[]) => {
        const mapped: MapPin[] = rows
          .map(row => {
            const coords = resolveCoords(row)
            if (!coords) return null
            const parts = [row.city, row.state, row.country].filter(Boolean)
            return { label: parts.join(', '), coords, count: row.count, key: parts.join('-') }
          })
          .filter((p): p is MapPin => p !== null)
        setPins(mapped.length > 0 ? mapped : FALLBACK)
      })
      .catch(() => setPins(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const handleMoveEnd = useCallback(({ coordinates, zoom }:MoveEndArgs) => {
    setCenter(coordinates); setZoom(zoom)
  }, [])

  const totalCustomers = pins === FALLBACK ? 0 : pins.reduce((s,p)=>s+p.count,0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Customer Locations</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Loading…' : pins === FALLBACK
              ? 'No location data yet — add city/state/country to customers'
              : `${pins.length} region${pins.length!==1?'s':''} · ${totalCustomers} customer${totalCustomers!==1?'s':''}`}
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

      <div className="relative bg-[#e8f0f7]" style={{ height:340 }}>
        <ComposableMap projection="geoMercator"
          projectionConfig={{ scale:140, center:[0,20] }}
          style={{ width:'100%', height:'100%' }}>
          <ZoomableGroup zoom={zoom} center={center} onMoveEnd={handleMoveEnd} minZoom={0.8} maxZoom={12}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) => geographies.map(geo => (
                <Geography key={geo.rsmKey} geography={geo}
                  fill="#d1dce8" stroke="#b8c8d9" strokeWidth={0.4}
                  style={{ default:{outline:'none'}, hover:{fill:'#b8cde0',outline:'none'}, pressed:{outline:'none'} }} />
              ))}
            </Geographies>
            {pins.map(pin => (
              <Marker key={pin.key} coordinates={pin.coords}
                onMouseEnter={() => setTooltip({ label:pin.label, count:pin.count })}
                onMouseLeave={() => setTooltip(null)}>
                <circle r={14/zoom} fill="#ef4444" fillOpacity={0.15} stroke="none" />
                <circle r={7/zoom} fill="#ef4444" stroke="#ffffff" strokeWidth={2/zoom} style={{ cursor:'pointer' }} />
                <text textAnchor="middle" y={-(13/zoom)}
                  style={{ fontSize:Math.max(9,11/zoom), fontWeight:700, fill:'#111827', pointerEvents:'none', textShadow:'0 1px 2px rgba(255,255,255,0.9)' }}>
                  {pin.label.split(',')[0]}
                </text>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 pointer-events-none">
            <p className="text-sm font-semibold text-gray-800">{tooltip.label}</p>
            {tooltip.count > 0 && <p className="text-xs text-gray-500 mt-0.5">{tooltip.count} customer{tooltip.count!==1?'s':''}</p>}
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200">
          <p className="text-xs text-gray-400">Scroll or pinch to zoom · Drag to pan</p>
        </div>
      </div>

      {pins !== FALLBACK && pins.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
          {pins.slice(0,8).map(pin => (
            <div key={pin.key} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm flex-shrink-0" />
              <span className="text-sm text-gray-600">{pin.label}</span>
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">{pin.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
