import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { geoMercator, geoPath } from 'd3-geo'
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

// Memoised so country fills don't re-render on every pan/zoom mouse-move
const CountryPaths = memo(function CountryPaths({ features, pathGenerator, activeCountry, activeCountryCodes, regions }) {
  return features.map((feat) => {
    // Normalize both sides: strip leading zeros so '036' === '36' === 36
    const featIdStr = String(parseInt(feat.id, 10))
    const isActive   = activeCountryCodes?.has(featIdStr)
    const hasData    = regions.some((r) => String(parseInt(r.countryCode, 10)) === featIdStr)
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
  // viewBox state: { x, y, w, h } — zoom/pan are expressed as viewBox changes
  // so the SVG itself never scales outside its container (no clipping)
  const [viewBox,    setViewBox]    = useState({ x: 0, y: 0, w: SVG_W, h: SVG_H })
  const [dragging,   setDragging]   = useState(false)
  const [dragStart,  setDragStart]  = useState(null)
  const [tooltip,    setTooltip]    = useState(null)
  const containerRef = useRef(null)

  // Load TopoJSON world map
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}world-110m.json`)
      .then((r) => r.json())
      .then((topo) => {
        setWorldData(feature(topo, topo.objects.countries))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Auto-zoom when activeCountry changes — update viewBox to fit country bounds
  useEffect(() => {
    if (!activeCountry || !countryBounds?.[activeCountry]) {
      // Reset to full APAC view
      setViewBox({ x: 0, y: 0, w: SVG_W, h: SVG_H })
      return
    }
    const proj = makeProjection()
    const { minLng, maxLng, minLat, maxLat } = countryBounds[activeCountry]
    const PADDING = 60
    const p1 = proj([minLng, maxLat])
    const p2 = proj([maxLng, minLat])
    if (!p1 || !p2) return
    const bW = Math.abs(p2[0] - p1[0])
    const bH = Math.abs(p2[1] - p1[1])
    if (bW === 0 || bH === 0) return
    // Expand bounds by padding (in SVG units)
    const cx = (p1[0] + p2[0]) / 2
    const cy = (p1[1] + p2[1]) / 2
    // Maintain aspect ratio of container
    const el = containerRef.current
    const aspect = el ? el.offsetWidth / el.offsetHeight : SVG_W / SVG_H
    let vw = bW + PADDING * 2
    let vh = vw / aspect
    if (vh < bH + PADDING * 2) {
      vh = bH + PADDING * 2
      vw = vh * aspect
    }
    setViewBox({
      x: cx - vw / 2,
      y: cy - vh / 2,
      w: vw,
      h: vh,
    })
  }, [activeCountry, countryBounds])

  const projection    = useMemo(() => makeProjection(), [])
  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection])

  const maxSupply = regions.length ? Math.max(...regions.map((r) => r.supply), 1) : 1

  // Build a set of active country codes for fast lookup (normalized — no leading zeros)
  const activeCountryCodes = useMemo(() => {
    if (!activeCountry) return null
    return new Set(
      regions
        .filter((r) => r.country === activeCountry)
        .map((r) => String(parseInt(r.countryCode, 10)))
        .filter((c) => c !== 'NaN')
    )
  }, [activeCountry, regions])

  // Scale factor between current viewBox and the default full view
  // Used to keep bubble sizes visually consistent regardless of zoom level
  const viewScale = SVG_W / viewBox.w

  function bubbleRadius(supply) {
    const base = 8 + (supply / maxSupply) * 26
    // Scale bubbles inversely so they don't grow huge when zoomed in
    return base / Math.sqrt(viewScale)
  }

  function project(lng, lat) {
    return projection([lng, lat])
  }

  // Zoom via viewBox shrink/expand around its center
  function zoomViewBox(factor) {
    setViewBox((vb) => {
      const newW = Math.min(Math.max(vb.w * factor, SVG_W / 8), SVG_W * 2)
      const newH = Math.min(Math.max(vb.h * factor, SVG_H / 8), SVG_H * 2)
      const cx = vb.x + vb.w / 2
      const cy = vb.y + vb.h / 2
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH }
    })
  }

  function handleZoomIn()  { zoomViewBox(1 / 1.5) }
  function handleZoomOut() { zoomViewBox(1.5) }
  function handleReset()   { setViewBox({ x: 0, y: 0, w: SVG_W, h: SVG_H }) }

  // Pan — convert mouse delta from screen pixels to SVG units
  function handleMouseDown(e) {
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, vb: viewBox })
  }
  function handleMouseMove(e) {
    if (!dragging || !dragStart) return
    const el = containerRef.current
    if (!el) return
    const scaleX = dragStart.vb.w / el.offsetWidth
    const scaleY = dragStart.vb.h / el.offsetHeight
    const dx = (e.clientX - dragStart.x) * scaleX
    const dy = (e.clientY - dragStart.y) * scaleY
    setViewBox({ ...dragStart.vb, x: dragStart.vb.x - dx, y: dragStart.vb.y - dy })
  }
  function handleMouseUp() { setDragging(false) }

  // Wheel zoom — zoom toward the cursor position
  const wheelHandler = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const factor = e.deltaY > 0 ? 1.25 : 0.8
    const el = containerRef.current
    if (!el) { zoomViewBox(factor); return }
    const rect  = el.getBoundingClientRect()
    setViewBox((vb) => {
      const newW = Math.min(Math.max(vb.w * factor, SVG_W / 8), SVG_W * 2)
      const newH = Math.min(Math.max(vb.h * factor, SVG_H / 8), SVG_H * 2)
      // Cursor position in SVG coords
      const mx = vb.x + ((e.clientX - rect.left) / rect.width)  * vb.w
      const my = vb.y + ((e.clientY - rect.top)  / rect.height) * vb.h
      // Keep cursor point stationary
      const rx = (mx - vb.x) / vb.w
      const ry = (my - vb.y) / vb.h
      return {
        x: mx - rx * newW,
        y: my - ry * newH,
        w: newW,
        h: newH,
      }
    })
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
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            transition: dragging ? 'none' : 'viewBox 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Ocean — covers the entire SVG coordinate space generously */}
          <rect x={-SVG_W} y={-SVG_H} width={SVG_W * 3} height={SVG_H * 3} fill="var(--geo-ocean)" />

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

          {/* Glow halos — only for visible regions with valid coordinates */}
          {visibleRegions.map((region) => {
            if (region.lat == null || region.lng == null) return null   // skip stubs with no coords
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
            if (region.lat == null || region.lng == null) return null   // skip stubs with no coords
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
