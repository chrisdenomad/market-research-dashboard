import { Globe, ChevronDown, GitCompare, Flag } from 'lucide-react'
import { useState, useMemo } from 'react'

const ZONES = ['All Zones', 'Southeast Asia', 'East Asia', 'South Asia', 'Oceania']

export default function RegionFilter({
  regions,
  selectedRegions,
  compareRegions,
  onToggleRegion,
  onSelectAll,
  onClearAll,
  onToggleCompare,
  compareMode,
  // Country filter
  activeCountry,
  onSetCountry,
}) {
  const [zoneFilter, setZoneFilter] = useState('All Zones')
  const [zoneOpen,   setZoneOpen]   = useState(false)
  const [countryOpen,setCountryOpen]= useState(false)

  // Unique countries derived from data
  const countries = useMemo(() => {
    const seen = new Set()
    const list = []
    regions.forEach((r) => {
      if (!seen.has(r.country)) { seen.add(r.country); list.push(r.country) }
    })
    return list.sort()
  }, [regions])

  // When a country is active, show only its cities regardless of zone filter
  // Otherwise apply zone filter normally
  const filteredRegions = useMemo(() => {
    let base = regions
    if (activeCountry) {
      base = regions.filter((r) => r.country === activeCountry)
    } else if (zoneFilter !== 'All Zones') {
      base = regions.filter((r) => r.zone === zoneFilter)
    }
    return base
  }, [regions, activeCountry, zoneFilter])

  const allSelected = selectedRegions.length === 0

  function handleCountrySelect(country) {
    onSetCountry(country === activeCountry ? null : country)
    setCountryOpen(false)
    // Reset city selection when changing country
    onSelectAll()
  }

  return (
    <div className="geo-filter-bar">

      {/* ── Country dropdown ──────────────────────────────────── */}
      <div className="geo-zone-dropdown">
        <button
          className={`geo-zone-toggle ${activeCountry ? 'geo-zone-toggle--active' : ''}`}
          onClick={() => { setCountryOpen((o) => !o); setZoneOpen(false) }}
          title="Filter by country"
        >
          <Flag size={13} />
          {activeCountry || 'All Countries'}
          <ChevronDown size={12} className={`geo-chevron ${countryOpen ? 'open' : ''}`} />
        </button>
        {countryOpen && (
          <div className="geo-zone-menu">
            <button
              className={`geo-zone-option ${!activeCountry ? 'active' : ''}`}
              onClick={() => { onSetCountry(null); setCountryOpen(false); onSelectAll() }}
            >
              All Countries
            </button>
            {countries.map((c) => {
              const cityCount = regions.filter((r) => r.country === c).length
              return (
                <button
                  key={c}
                  className={`geo-zone-option ${activeCountry === c ? 'active' : ''}`}
                  onClick={() => handleCountrySelect(c)}
                >
                  {c}
                  <span className="geo-country-city-count">{cityCount} city{cityCount !== 1 ? ' nodes' : ' node'}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Zone dropdown (disabled when country is active) ───── */}
      {!activeCountry && (
        <div className="geo-zone-dropdown">
          <button
            className="geo-zone-toggle"
            onClick={() => { setZoneOpen((o) => !o); setCountryOpen(false) }}
          >
            <Globe size={13} />
            {zoneFilter}
            <ChevronDown size={12} className={`geo-chevron ${zoneOpen ? 'open' : ''}`} />
          </button>
          {zoneOpen && (
            <div className="geo-zone-menu">
              {ZONES.map((z) => (
                <button
                  key={z}
                  className={`geo-zone-option ${zoneFilter === z ? 'active' : ''}`}
                  onClick={() => { setZoneFilter(z); setZoneOpen(false) }}
                >
                  {z}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── City pills ────────────────────────────────────────── */}
      <div className="geo-region-btns">
        {!activeCountry && (
          <button
            className={`geo-region-btn geo-region-btn-all ${allSelected ? 'active' : ''}`}
            onClick={onSelectAll}
          >
            All
          </button>
        )}

        {filteredRegions.map((region) => {
          const isSelected = selectedRegions.includes(region.id)
          const inCompare  = compareRegions.includes(region.id)
          return (
            <button
              key={region.id}
              className={`geo-region-btn ${isSelected ? 'active' : ''} ${inCompare ? 'compare' : ''}`}
              style={isSelected ? { borderColor: region.color, background: region.color + '22' } : {}}
              onClick={() => onToggleRegion(region.id)}
              title={`${region.name}, ${region.country}`}
            >
              <span className="geo-region-dot" style={{ background: region.color }} />
              {region.name}
              {inCompare && <span className="geo-compare-badge">C</span>}
            </button>
          )
        })}

        {filteredRegions.length === 0 && (
          <span className="geo-no-cities">No cities in data for this country yet</span>
        )}
      </div>

      {/* ── Compare toggle ────────────────────────────────────── */}
      <button
        className={`geo-compare-toggle ${compareMode ? 'active' : ''}`}
        onClick={onToggleCompare}
        title="Toggle compare mode — select 2–4 regions"
      >
        <GitCompare size={13} />
        Compare {compareMode && compareRegions.length > 0 ? `(${compareRegions.length})` : ''}
      </button>

      {selectedRegions.length > 0 && (
        <button className="geo-clear-btn" onClick={onClearAll}>Clear</button>
      )}
    </div>
  )
}
