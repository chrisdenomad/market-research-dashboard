import { useState, useCallback } from 'react'
import { Map, TrendingUp, Table2, GitCompare } from 'lucide-react'
import { useData } from '../context/DataContext'
import GeoMap from './GeoMap'
import RegionFilter from './RegionFilter'
import SupplyTrendChart from './SupplyTrendChart'
import GeoDataTable from './GeoDataTable'
import RegionComparison from './RegionComparison'

const TABS = [
  { id: 'map',        label: 'Heat Map',     Icon: Map },
  { id: 'trend',      label: 'Trend Charts', Icon: TrendingUp },
  { id: 'table',      label: 'Data Table',   Icon: Table2 },
  { id: 'comparison', label: 'Compare',      Icon: GitCompare },
]

export default function GeographicDistribution() {
  const { data } = useData()
  const regions      = data.geoRegions    || []
  const trendData    = data.geoTrendData  || []
  const rawBounds    = data.countryBounds || {}

  // Auto-fill missing countryBounds from the lat/lng of each region
  // so newly added countries (e.g. Vietnam) auto-zoom without manual bounds entry
  const countryBounds = (() => {
    const derived = { ...rawBounds }
    regions.forEach((r) => {
      if (!r.country || !r.lat || !r.lng) return
      if (derived[r.country]) return  // already defined — don't overwrite explicit bounds
      derived[r.country] = {
        minLng: r.lng - 2,
        maxLng: r.lng + 2,
        minLat: r.lat - 2,
        maxLat: r.lat + 2,
      }
    })
    // Merge regions of the same country to a single tight bounding box
    const byCountry = {}
    regions.forEach((r) => {
      if (!r.country || !r.lat || !r.lng) return
      if (!byCountry[r.country]) byCountry[r.country] = []
      byCountry[r.country].push(r)
    })
    Object.entries(byCountry).forEach(([country, rs]) => {
      if (rawBounds[country]) return  // keep explicit bounds as-is
      const lats = rs.map((r) => r.lat)
      const lngs = rs.map((r) => r.lng)
      const PADDING = 2
      derived[country] = {
        minLng: Math.min(...lngs) - PADDING,
        maxLng: Math.max(...lngs) + PADDING,
        minLat: Math.min(...lats) - PADDING,
        maxLat: Math.max(...lats) + PADDING,
      }
    })
    return derived
  })()

  const [activeTab,       setActiveTab]       = useState('map')
  const [selectedRegions, setSelectedRegions] = useState([])
  const [compareRegions,  setCompareRegions]  = useState([])
  const [compareMode,     setCompareMode]     = useState(false)
  const [activeCountry,   setActiveCountry]   = useState(null)

  // Guard AFTER all hooks — never call hooks conditionally
  const provided = data.providedSections
  if (!provided || !provided.includes('geo')) return null

  // ── Country filter ──────────────────────────────────────────
  function handleSetCountry(country) {
    setActiveCountry(country)
    setSelectedRegions([]) // reset city selection when switching country
  }

  // ── City / region toggle ────────────────────────────────────
  function handleToggleRegion(id) {
    if (compareMode) {
      setCompareRegions((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id)
        if (prev.length >= 4)  return prev
        return [...prev, id]
      })
    } else {
      setSelectedRegions((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }
  }

  function handleSelectAll() { setSelectedRegions([]) }
  function handleClearAll()  { setSelectedRegions([]) }

  function handleToggleCompare() {
    setCompareMode((m) => {
      if (!m) setActiveTab('comparison')
      return !m
    })
  }

  function handleRemoveCompare(id) {
    setCompareRegions((prev) => prev.filter((x) => x !== id))
  }

  // ── CSV export ──────────────────────────────────────────────
  const handleExport = useCallback(() => {
    let display = activeCountry
      ? regions.filter((r) => r.country === activeCountry)
      : regions
    if (selectedRegions.length > 0) {
      display = display.filter((r) => selectedRegions.includes(r.id))
    }

    const headers = ['Region', 'Country', 'Zone', 'Supply', 'Available', 'Avail Rate %', 'Market Share %', 'YoY Change %']
    const rows = display.map((r) => [
      r.name, r.country, r.zone, r.supply, r.available,
      r.supply ? Math.round((r.available / r.supply) * 100) : 0,
      r.marketShare, r.yoyChange,
    ])
    const csv  = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `geographic-supply${activeCountry ? '-' + activeCountry : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [regions, selectedRegions, activeCountry])

  // ── Header summary stats ────────────────────────────────────
  const displayRegions = (() => {
    let base = activeCountry ? regions.filter((r) => r.country === activeCountry) : regions
    if (selectedRegions.length > 0) base = base.filter((r) => selectedRegions.includes(r.id))
    return base
  })()
  const totalSupply    = displayRegions.reduce((s, r) => s + r.supply, 0)
  const totalAvailable = displayRegions.reduce((s, r) => s + r.available, 0)
  const avgYoy         = displayRegions.length
    ? Math.round(displayRegions.reduce((s, r) => s + r.yoyChange, 0) / displayRegions.length)
    : 0

  // Count unique countries represented in data
  const uniqueCountries = [...new Set(regions.map((r) => r.country))]

  return (
    <div className="card geo-card" id="geo-distribution">
      {/* Card header */}
      <div className="card-header">
        <div>
          <h2 className="card-title">{(data.widgetTitles || {}).geoDistribution || 'Geographic Distribution'}</h2>
          <p className="card-subtitle">
            {activeCountry
              ? `${activeCountry} · ${displayRegions.length} city node${displayRegions.length !== 1 ? 's' : ''}`
              : `${uniqueCountries.length} countries · ${regions.length} city nodes · ${selectedRegions.length > 0 ? selectedRegions.length + ' selected' : 'All regions'}`
            }
          </p>
        </div>
        <div className="geo-header-stats">
          <div className="geo-header-stat">
            <span className="geo-header-stat-val">{totalSupply}</span>
            <span className="geo-header-stat-lbl">Total Supply</span>
          </div>
          <div className="geo-header-stat">
            <span className="geo-header-stat-val">{totalAvailable}</span>
            <span className="geo-header-stat-lbl">Available</span>
          </div>
          <div className="geo-header-stat">
            <span
              className="geo-header-stat-val"
              style={{ color: avgYoy >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {avgYoy >= 0 ? '+' : ''}{avgYoy}%
            </span>
            <span className="geo-header-stat-lbl">Avg YoY</span>
          </div>
          <span className="card-badge">{activeCountry || 'APAC'}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="no-pdf">
        <RegionFilter
          regions={regions}
          selectedRegions={selectedRegions}
          compareRegions={compareRegions}
          onToggleRegion={handleToggleRegion}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          onToggleCompare={handleToggleCompare}
          compareMode={compareMode}
          activeCountry={activeCountry}
          onSetCountry={handleSetCountry}
        />
      </div>

      {/* Tab navigation */}
      <div className="geo-tabs no-pdf">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`geo-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={13} />
            {label}
            {id === 'comparison' && compareRegions.length > 0 && (
              <span className="geo-tab-badge">{compareRegions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="geo-panel">
        {activeTab === 'map' && (
          <GeoMap
            regions={regions}
            selectedRegions={selectedRegions}
            onRegionClick={handleToggleRegion}
            activeCountry={activeCountry}
            countryBounds={countryBounds}
          />
        )}

        {activeTab === 'trend' && (
          <SupplyTrendChart
            trendData={trendData}
            regions={activeCountry ? regions.filter((r) => r.country === activeCountry) : regions}
            selectedRegions={selectedRegions}
          />
        )}

        {activeTab === 'table' && (
          <GeoDataTable
            regions={activeCountry ? regions.filter((r) => r.country === activeCountry) : regions}
            selectedRegions={selectedRegions}
            onExport={handleExport}
          />
        )}

        {activeTab === 'comparison' && (
          <RegionComparison
            regions={regions}
            compareRegions={compareRegions}
            onRemove={handleRemoveCompare}
          />
        )}
      </div>
    </div>
  )
}
