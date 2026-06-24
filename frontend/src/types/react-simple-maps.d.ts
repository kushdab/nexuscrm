declare module 'react-simple-maps' {
  import * as React from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    width?: number
    height?: number
    style?: React.CSSProperties
    [key: string]: unknown
  }
  export const ComposableMap: React.FC<ComposableMapProps>

  export interface ZoomableGroupProps {
    zoom?: number
    center?: [number, number]
    minZoom?: number
    maxZoom?: number
    onMoveEnd?: (args: { coordinates: [number, number]; zoom: number }) => void
    children?: React.ReactNode
    [key: string]: unknown
  }
  export const ZoomableGroup: React.FC<ZoomableGroupProps>

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: any[] }) => React.ReactNode
  }
  export const Geographies: React.FC<GeographiesProps>

  export interface GeographyProps {
    geography: unknown
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: { default?: React.CSSProperties; hover?: React.CSSProperties; pressed?: React.CSSProperties }
    [key: string]: unknown
  }
  export const Geography: React.FC<GeographyProps>

  export interface MarkerProps {
    coordinates: [number, number]
    children?: React.ReactNode
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    [key: string]: unknown
  }
  export const Marker: React.FC<MarkerProps>
}
