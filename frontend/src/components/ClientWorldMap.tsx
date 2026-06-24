'use client'
import { useState, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Client locations — Utah is the primary market; add more as client base grows
const CLIENT_LOCATIONS = [
  {
    name: 'Utah',
    coordinates: [-111.0937, 39.3210] as [number, number],
    clients: 24,
    city: 'Salt Lake City, UT',
  },
]

interface MoveEndArgs {
  coordinates: [number, number]
  zoom: number
}

export default function ClientWorldMap() {
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 20])
  const [tooltip, setTooltip] = useState<{ name: string; clients: number; city: string } | null>(null)

  const handleMoveEnd = useCallback(({ coordinates, zoom }: MoveEndArgs) => {
    setCenter(coordinates)
    setZoom(zoom)
  }, [])

  const zoomIn  = () => setZoom(z => Math.min(z * 1.5, 12))
  const zoomOut = () => setZoom(z => Math.max(z / 1.5, 1))
  const reset   = () => { setZoom(1); setCenter([0, 20]) }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Client Locations</h3>
          <p className="text-xs text-gray-400 mt-0.5">{CLIENT_LOCATIONS.length} region · {CLIENT_LOCATIONS.reduce((s,l) => s+l.clients, 0)} clients</p>
        </div>
        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button onClick={zoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors text-lg font-bold">
            +
          </button>
          <button onClick={zoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors text-lg font-bold">
            −
          </button>
          <button onClick={reset}
            className="px-3 h-8 flex items-center rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative bg-[#e8f0f7]" style={{ height: 340 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 140, center: [0, 20] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={handleMoveEnd}
            minZoom={0.8}
            maxZoom={12}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#d1dce8"
                    stroke="#b8c8d9"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover:   { fill: '#b8cde0', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {CLIENT_LOCATIONS.map(loc => (
              <Marker
                key={loc.name}
                coordinates={loc.coordinates}
                onMouseEnter={() => setTooltip({ name: loc.name, clients: loc.clients, city: loc.city })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Pulse ring */}
                <circle
                  r={14 / zoom}
                  fill="#ef4444"
                  fillOpacity={0.15}
                  stroke="none"
                />
                {/* Main dot */}
                <circle
                  r={7 / zoom}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth={2 / zoom}
                  style={{ cursor: 'pointer' }}
                />
                {/* Label (visible at zoom ≥ 1) */}
                <text
                  textAnchor="middle"
                  y={-(13 / zoom)}
                  style={{
                    fontSize: Math.max(9, 11 / zoom),
                    fontWeight: 700,
                    fill: '#111827',
                    pointerEvents: 'none',
                    textShadow: '0 1px 2px rgba(255,255,255,0.9)',
                  }}
                >
                  {loc.name}
                </text>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 pointer-events-none">
            <p className="text-sm font-semibold text-gray-800">{tooltip.city}</p>
            <p className="text-xs text-gray-500 mt-0.5">{tooltip.clients} clients</p>
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200">
          <p className="text-xs text-gray-400">Scroll or pinch to zoom · Drag to pan</p>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-4">
        {CLIENT_LOCATIONS.map(loc => (
          <div key={loc.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            <span className="text-sm text-gray-600">{loc.city}</span>
            <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">
              {loc.clients} clients
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
