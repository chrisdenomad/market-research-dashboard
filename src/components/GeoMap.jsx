import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { geoMercator, geoPath, geoBounds } from 'd3-geo'
import { feature } from 'topojson-client'

const SVG_W = 960
const SVG_H = 560

// Base APAC projection (full overview)
function makeProjection() {
  return geoMercator()
    .center([120, 5])
    .scale(SVG_W / (2 * Math.PI) * (360 / 120) * Math.PI)
    .translate([SVG_W / 2, SVG_H / 2])
}

const SUPPLY_LEVEL_COLOR = (supply, max) => {
  const pct = supply / max
  if (pct > 0.65) return '#22c55e'
  if (pct > 0.35) return '#f59e0b'
  return '#ef4444'
}

// Given a country bounding box (lng/lat), compute the zoom + pan
// needed to fill an SVG_W × SVG_H canvas, with padding.
function fitCountry(bounds, projection, containerW, containerH) {
  const { minLng, maxLng, minLat, maxLat } = bounds
  const PADDING = 40

  const p1 = projection([minLng, maxLat]) // top-left in SVG
  const p2 = projection([maxLng, minLat]) // bottom-right in SVG
  if (!p1 || !p2) return null

  const bW = Math.abs(p2[0] - p1[0])
  const bH = Math.abs(p2[1] - p1[1])
  if (bW === 0 || bH === 0) return null

  // Scale to fill container with padding
  const scaleX = (containerW - PADDING * 2) / bW
  const scaleY = (containerH - PADDING * 2) / bH
  const zoom = Math.min(scaleX, scaleY, 8)

  // Center of the bounding box in SVG coords
  const cx = (p1[0] + p2[0]) / 2
  const cy = (p1[1] + p2[1]) / 2

  // Pan so that center maps to middle of container
  const panX = containerW / 2 - cx * zoom
  const panY = containerH / 2 - cy * zoom

  return { zoom, panX, panY }
}

// Memoised so country fills don't re-render on every pan/zoom mouse-move
const CountryPaths = memo(function CountryPaths({ features, pathGenerator, activeCountry, activeCountryCodes, regions }) {
  return features.map((feat) => {
    const isActive   = activeCountryCodes?.has(String(feat.id))
    const hasData    = regions.some((r) => r.countryCode === String(feat.id))
    const isFaded    = activeCountry && !isActive

    let fill   = 'var(--geo-land)'
    let stroke = 'var(--geo-land-stroke)'
    let opacity = 1

    if (activeCountry) {
      if (isActive) {
        fill    = 'var(--accent)'
        stroke  = 'var(--accent-light)'
        opacity = 0.55
      } else {
        opacity = 0.2
      }
    } else if (hasData) {
      fill    = 'var(--geo-land-data, #3d4f7c)'
      stroke  = 'var(--accent)'
      opacity = 0.5
    }

    return (
      <path
        key={feat.id}
        d={pathGenerator(feat) || ''}
        fill={fill}
        stroke={stroke}
        strokeWidth={isActive ? 1.5 : 0.6}
        opacity={opacity}
        style={{ transition: 'opacity 0.3s ease, fill 0.3s ease' }}
      />
    )
  })
})

export default function GeoMap({ regions, selectedRegions, onRegionClick, activeCountry, countryBounds }) {
  const [worldData,  setWorldData]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [zoom,       setZoom]       = useState(1)
  const [pan,        setPan]        = useState({ x: 0, y: 0 })
  const [dragging,   setDragging]   = useState(false)
  const [dragStart,  setDragStart]  = useState(null)
  const [tooltip,    setTooltip]    = useState(null)
  const containerRef = useRef(null)

  // Load TopoJSON world map
  useEffect(() => {
    fetch('/world-110m.json')
      .then((r) => r.json())
      .then((topo) => {
        setWorldData(feature(topo, topo.objects.countries))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Auto-zoom when activeCountry changes
  useEffect(() => {
    if (!activeCountry || !countryBounds?.[activeCountry] || !containerRef.current) {
      // Reset to full APAC view
      setZoom(1)
      setPan({ x: 0, y: 0 })
      return
    }
    const el = containerRef.current
    const fit = fitCountry(
      countryBounds[activeCountry],
      makeProjection(),
      el.offsetWidth,
      el.offsetHeight,
    )
    if (!fit) return
    setZoom(fit.zoom)
    setPan({ x: fit.panX, y: fit.panY })
  }, [activeCountry, countryBounds])

  const projection    = useMemo(() => makeProjection(), [])
  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection])

  const maxSupply = regions.length ? Math.max(...regions.map((r) => r.supply), 1) : 1

  // Build a set of active country codes for fast lookup
  const activeCountryCodes = useMemo(() => {
    if (!activeCountry) return null
    return new Set(
      regions
        .filter((r) => r.country === activeCountry)
        .map((r) => r.countryCode)
    )
  }, [activeCountry, regions])

  function bubbleRadius(supply) {
    return 8 + (supply / maxSupply) * 26
  }

  function project(lng, lat) {
    return projection([lng, lat])
  }

  // Zoom buttons
  function handleZoomIn()  { setZoom((z) => Math.min(z + 0.4, 8)) }
  function handleZoomOut() { setZoom((z) => Math.max(z - 0.4, 0.5)) }
  function handleReset() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Pan
  function handleMouseDown(e) {
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  function handleMouseMove(e) {
    if (!dragging || !dragStart) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  function handleMouseUp() { setDragging(false) }

  // Wheel zoom — ref-callback pattern guarantees passive:false before any scroll event
  const wheelHandler = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.2 : 0.2
    setZoom((z) => Math.min(Math.max(z + delta, 0.5), 8))
  }, [])

  const containerCallbackRef = useCallback((el) => {
    if (containerRef.current) {
      containerRef.current.removeEventListener('wheel', wheelHandler)
    }
    containerRef.current = el
    if (el) {
      el.addEventListener('wheel', wheelHandler, { passive: false })
    }
  }, [wheelHandler])

  function handleBubbleClick(region, e) {
    e.stopPropagation()
    onRegionClick(region.id)
  }

  function handleBubbleEnter(region, e) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ region, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function handleBubbleLeave() { setTooltip(null) }

  // Visible city bubbles: if a country is active, only show cities for that country
  const visibleRegions = useMemo(() => {
    if (!activeCountry) return regions
    return regions.filter((r) => r.country === activeCountry)
  }, [activeCountry, regions])

  return (
    <div className="geo-map-wrap">
      {/* Top bar — legend + zoom controls */}
      <div className="geo-map-topbar">
        <div className="geo-zone-legend">
          <span className="geo-supply-item"><span className="geo-supply-dot" style={{ background: '#22c55e' }} />High supply</span>
          <span className="geo-supply-item"><span className="geo-supply-dot" style={{ background: '#f59e0b' }} />Medium supply</span>
          <span className="geo-supply-item"><span className="geo-supply-dot" style={{ background: '#ef4444' }} />Lower supply</span>
          <span className="geo-supply-item geo-supply-bubble-hint">Bubble size = total profiles</span>
        </div>
        <div className="geo-map-controls">
          <button className="geo-map-btn" onClick={handleZoomIn}  title="Zoom in">  <ZoomIn  size={14} /></button>
          <button className="geo-map-btn" onClick={handleZoomOut} title="Zoom out"> <ZoomOut size={14} /></button>
          <button className="geo-map-btn" onClick={handleReset}   title="Reset view"><Maximize2 size={14} /></button>
        </div>
      </div>

      {/* Active country banner */}
      {activeCountry && (
        <div className="geo-country-banner">
          <span className="geo-country-banner-dot" />
          Showing <strong>{activeCountry}</strong> —{' '}
          {visibleRegions.length} city{visibleRegions.length !== 1 ? ' nodes' : ' node'}
          {visibleRegions.length === 1 && ' · zoom to single-city view'}
        </div>
      )}

      <div
        className="geo-map-container"
        ref={containerCallbackRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        {loading && (
          <div className="geo-map-loading">
            <div className="ai-loading-dots"><span /><span /><span /></div>
            <span>Loading map…</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Ocean */}
          <rect width={SVG_W} height={SVG_H} fill="var(--geo-ocean)" />

          {/* Graticule */}
          {[-30, 0, 30].map((lat) => {
            const p1 = project(60,  lat)
            const p2 = project(180, lat)
            return p1 && p2 ? (
              <line key={`lat${lat}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
                stroke="var(--geo-grid)" strokeWidth="0.8" strokeDasharray="4,6" />
            ) : null
          })}
          {[80, 100, 120, 140, 160].map((lng) => {
            const p1 = project(lng, -50)
            const p2 = project(lng,  55)
            return p1 && p2 ? (
              <line key={`lng${lng}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
                stroke="var(--geo-grid)" strokeWidth="0.8" strokeDasharray="4,6" />
            ) : null
          })}

          {/* Country fills */}
          {worldData && (
            <CountryPaths
              features={worldData.features}
              pathGenerator={pathGenerator}
              activeCountry={activeCountry}
              activeCountryCodes={activeCountryCodes}
              regions={regions}
            />
          )}

          {/* Glow halos — only for visible regions */}
          {visibleRegions.map((region) => {
            const pos = project(region.lng, region.lat)
            if (!pos) return null
            const isShown = selectedRegions.length === 0 || selectedRegions.includes(region.id)
            const r = bubbleRadius(region.supply)
            return isShown ? (
              <circle key={`glow-${region.id}`}
                cx={pos[0]} cy={pos[1]} r={r + 16}
                fill={region.color} opacity={0.12}
              />
            ) : null
          })}

          {/* City bubbles */}
          {visibleRegions.map((region) => {
            const pos = project(region.lng, region.lat)
            if (!pos) return null
            const isShown  = selectedRegions.length === 0 || selectedRegions.includes(region.id)
            const isActive = selectedRegions.includes(region.id)
            const r = bubbleRadius(region.supply)
            const levelColor = SUPPLY_LEVEL_COLOR(region.supply, maxSupply)

            return (
              <g
                key={region.id}
                onClick={(e) => handleBubbleClick(region, e)}
                onMouseEnter={(e) => handleBubbleEnter(region, e)}
                onMouseLeave={handleBubbleLeave}
                style={{ cursor: 'pointer' }}
                opacity={isShown ? 1 : 0.2}
              >
                {isActive && (
                  <circle cx={pos[0]} cy={pos[1]} r={r + 8}
                    fill="none" stroke={region.color} strokeWidth="2"
                    opacity={0.55} className="geo-pulse"
                  />
                )}
                <circle cx={pos[0]} cy={pos[1]} r={r}
                  fill={region.color}
                  stroke={isActive ? '#ffffff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={0.85}
                />
                <circle
                  cx={pos[0] + r * 0.68} cy={pos[1] - r * 0.68} r={4}
                  fill={levelColor} stroke="var(--geo-ocean)" strokeWidth="1"
                />
                <text x={pos[0]} y={pos[1] + 4}
                  textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {region.supply}
                </text>
                <text x={pos[0]} y={pos[1] + r + 13}
                  textAnchor="middle" fontSize="10"
                  fill="var(--text-secondary)" fontWeight="600"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {region.name}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="geo-tooltip"
            style={{
              left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth || 600) - 195),
              top:  Math.max(tooltip.y - 10, 8),
            }}
          >
            <div className="geo-tooltip-title">
              <span className="geo-tooltip-dot" style={{ background: tooltip.region.color }} />
              {tooltip.region.name}
              <span className="geo-tooltip-country">{tooltip.region.country}</span>
            </div>
            <div className="geo-tooltip-row"><span>Zone</span><strong>{tooltip.region.zone}</strong></div>
            <div className="geo-tooltip-row"><span>Supply</span><strong>{tooltip.region.supply.toLocaleString()}</strong></div>
            <div className="geo-tooltip-row"><span>Available</span><strong>{tooltip.region.available.toLocaleString()}</strong></div>
            <div className="geo-tooltip-row">
              <span>Avail. rate</span>
              <strong>{tooltip.region.supply ? Math.round((tooltip.region.available / tooltip.region.supply) * 100) : 0}%</strong>
            </div>
            <div className="geo-tooltip-row"><span>Market share</span><strong>{tooltip.region.marketShare}%</strong></div>
            <div className="geo-tooltip-row">
              <span>YoY change</span>
              <strong style={{ color: tooltip.region.yoyChange >= 0 ? '#22c55e' : '#ef4444' }}>
                {tooltip.region.yoyChange >= 0 ? '+' : ''}{tooltip.region.yoyChange}%
              </strong>
            </div>
            <div className="geo-tooltip-hint">Click to select / deselect</div>
          </div>
        )}
      </div>

      <p className="geo-map-hint">Scroll to zoom · Drag to pan · Click bubble to filter · Select a country above to focus</p>
    </div>
  )
}
