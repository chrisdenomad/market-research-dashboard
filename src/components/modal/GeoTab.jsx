import { useState } from 'react'
import { Trash2, Plus, ChevronDown, ChevronUp, Search } from 'lucide-react'

const ZONE_OPTIONS = ['Southeast Asia', 'East Asia', 'South Asia', 'Oceania', 'Other']

// Common APAC countries with ISO numeric code + capital lat/lng for quick fill
const COUNTRY_LOOKUP = [
  { name: 'Vietnam',          code: '704', lat:  21.0285, lng: 105.8542, zone: 'Southeast Asia' },
  { name: 'Singapore',        code: '702', lat:   1.3521, lng: 103.8198, zone: 'Southeast Asia' },
  { name: 'Thailand',         code: '764', lat:  13.7563, lng: 100.5018, zone: 'Southeast Asia' },
  { name: 'Indonesia',        code: '360', lat:  -6.2088, lng: 106.8456, zone: 'Southeast Asia' },
  { name: 'Malaysia',         code: '458', lat:   3.1390, lng: 101.6869, zone: 'Southeast Asia' },
  { name: 'Philippines',      code: '608', lat:  14.5995, lng: 120.9842, zone: 'Southeast Asia' },
  { name: 'Myanmar',          code: '104', lat:  16.8661, lng:  96.1951, zone: 'Southeast Asia' },
  { name: 'Cambodia',         code: '116', lat:  11.5564, lng: 104.9282, zone: 'Southeast Asia' },
  { name: 'China',            code: '156', lat:  39.9042, lng: 116.4074, zone: 'East Asia'      },
  { name: 'Japan',            code: '392', lat:  35.6762, lng: 139.6503, zone: 'East Asia'      },
  { name: 'South Korea',      code: '410', lat:  37.5665, lng: 126.9780, zone: 'East Asia'      },
  { name: 'Taiwan',           code: '158', lat:  25.0330, lng: 121.5654, zone: 'East Asia'      },
  { name: 'Hong Kong SAR',    code: '344', lat:  22.3193, lng: 114.1694, zone: 'East Asia'      },
  { name: 'India',            code: '356', lat:  28.6139, lng:  77.2090, zone: 'South Asia'     },
  { name: 'Australia',        code: '036', lat: -33.8688, lng: 151.2093, zone: 'Oceania'        },
  { name: 'New Zealand',      code: '554', lat: -36.8485, lng: 174.7633, zone: 'Oceania'        },
]

// Always-visible lookup panel (no internal toggle — parent controls visibility)
function CountryLookup({ onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = COUNTRY_LOOKUP.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="geo-lookup-panel">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          className="form-input"
          placeholder="Search country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ flex: 1 }}
        />
      </div>
      <div className="geo-lookup-table-wrap">
        <table className="geo-lookup-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>ISO Code</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Zone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.code}>
                <td>{c.name}</td>
                <td><code>{c.code}</code></td>
                <td>{c.lat}</td>
                <td>{c.lng}</td>
                <td>{c.zone}</td>
                <td>
                  <button
                    type="button"
                    className="geo-lookup-use-btn"
                    onClick={() => { onSelect(c); onClose() }}
                  >
                    Use
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                  No match
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)' }}>
        "Use" fills Country, ISO Code, Lat, Lng and Zone into this region row.
      </p>
    </div>
  )
}

export default function GeoTab({ data, onChange, onBatch }) {
  const regions   = data.geoRegions   || []
  const trendData = data.geoTrendData || []
  const [lookupTargetIdx, setLookupTargetIdx] = useState(null)

  // Fill a region row from the lookup table
  function fillFromLookup(i, entry) {
    const next = regions.map((r, idx) =>
      idx === i
        ? { ...r, country: entry.name, countryCode: entry.code, lat: entry.lat, lng: entry.lng, zone: entry.zone }
        : r
    )
    onChange('geoRegions', next)
    setLookupTargetIdx(null)
  }

  // ── Regions ────────────────────────────────────────────────────────────────
  function setRegionField(i, field, val) {
    const numFields = ['supply', 'available', 'lat', 'lng', 'yoyChange', 'marketShare']
    const coerced = numFields.includes(field) ? (Number(val) || 0) : val

    // If the ID changes, rename the matching column in geoTrendData atomically
    if (field === 'id') {
      const oldId = regions[i].id
      const newId = val
      const nextRegions = regions.map((r, idx) =>
        idx === i ? { ...r, id: newId } : r
      )
      const nextTrend = trendData.map((row) => {
        const { [oldId]: colVal, ...rest } = row
        return { ...rest, [newId]: colVal ?? 0 }
      })
      onBatch({ geoRegions: nextRegions, geoTrendData: nextTrend })
      return
    }

    const next = regions.map((r, idx) =>
      idx === i ? { ...r, [field]: coerced } : r
    )
    onChange('geoRegions', next)
  }

  function addRegion() {
    const colors = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#7c3aed','#4f46e5','#818cf8','#6d28d9']
    const newId = `city${regions.length + 1}`
    const newRegion = {
      id: newId,
      name: '',
      country: '',
      countryCode: '',
      zone: 'Southeast Asia',
      supply: 0,
      available: 0,
      lat: 0,
      lng: 0,
      color: colors[regions.length % colors.length],
      yoyChange: 0,
      marketShare: 0,
    }
    // Batch both updates atomically so neither overwrites the other
    const nextTrend = trendData.map((row) => ({ ...row, [newId]: 0 }))
    onBatch({ geoRegions: [...regions, newRegion], geoTrendData: nextTrend })
  }

  function removeRegion(i) {
    const removed = regions[i]
    const nextRegions = regions.filter((_, idx) => idx !== i)
    // Remove the corresponding trend column — batch with regions update
    const nextTrend = trendData.map((row) => {
      const { [removed.id]: _drop, ...rest } = row
      return rest
    })
    onBatch({ geoRegions: nextRegions, geoTrendData: nextTrend })
  }

  // ── Trend Data ─────────────────────────────────────────────────────────────
  function setTrendCell(rowIdx, regionId, val) {
    const next = trendData.map((row, i) =>
      i === rowIdx ? { ...row, [regionId]: Number(val) || 0 } : row
    )
    onChange('geoTrendData', next)
  }

  function addTrendMonth() {
    const blank = { month: '' }
    regions.forEach((r) => { blank[r.id] = 0 })
    onChange('geoTrendData', [...trendData, blank])
  }

  function removeTrendMonth(i) {
    onChange('geoTrendData', trendData.filter((_, idx) => idx !== i))
  }

  return (
    <div className="tab-content">

      {/* ── Regions ── */}
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Geographic Regions</h3>
          <p className="form-section-desc">
            City nodes shown on the map, trend chart, data table, and comparison panel.
            Supply &amp; Available here are the master values — editing Market Size cities
            above will also update these automatically.
          </p>
        </div>

        {regions.map((r, i) => (
          <div key={i} className="form-card" style={{ borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="form-card-title" style={{ color: r.color }}>
                {r.name || `Region ${i + 1}`} · {r.country}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className="geo-lookup-toggle"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setLookupTargetIdx(lookupTargetIdx === i ? null : i)}
                  title="Fill country code & coordinates from lookup"
                >
                  <Info size={12} />
                  {lookupTargetIdx === i ? 'Close lookup' : 'Lookup country'}
                </button>
                <button className="row-delete-btn" onClick={() => removeRegion(i)} title="Remove region">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Inline country lookup for this region */}
            {lookupTargetIdx === i && (
              <CountryLookup
                onSelect={(entry) => fillFromLookup(i, entry)}
                onClose={() => setLookupTargetIdx(null)}
              />
            )}

            {/* Row 1: id, name, country, countryCode, zone */}
            <div className="form-grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="form-row">
                <label className="form-label">ID (short key, e.g. sg)</label>
                <input
                  className="form-input"
                  value={r.id || ''}
                  onChange={(e) => setRegionField(i, 'id', e.target.value)}
                  placeholder="sg"
                />
              </div>
              <div className="form-row">
                <label className="form-label">City Name</label>
                <input
                  className="form-input"
                  value={r.name || ''}
                  onChange={(e) => setRegionField(i, 'name', e.target.value)}
                  placeholder="Singapore"
                />
              </div>
              <div className="form-row">
                <label className="form-label">Country</label>
                <input
                  className="form-input"
                  value={r.country || ''}
                  onChange={(e) => setRegionField(i, 'country', e.target.value)}
                  placeholder="Singapore"
                />
              </div>
              <div className="form-row">
                <label className="form-label">Country Code (ISO numeric)</label>
                <input
                  className="form-input"
                  value={r.countryCode || ''}
                  onChange={(e) => setRegionField(i, 'countryCode', e.target.value)}
                  placeholder="702"
                />
              </div>
              <div className="form-row">
                <label className="form-label">Zone / Region</label>
                <select
                  className="form-input"
                  value={r.zone || 'Southeast Asia'}
                  onChange={(e) => setRegionField(i, 'zone', e.target.value)}
                >
                  {ZONE_OPTIONS.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={r.color || '#6366f1'}
                    onChange={(e) => setRegionField(i, 'color', e.target.value)}
                    style={{ width: 36, height: 34, padding: 2, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'none' }}
                    title="Pick color"
                  />
                  <input
                    className="form-input"
                    value={r.color || ''}
                    onChange={(e) => setRegionField(i, 'color', e.target.value)}
                    placeholder="#6366f1"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: supply, available, yoyChange, marketShare, lat, lng */}
            <div className="form-grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 8 }}>
              <div className="form-row">
                <label className="form-label">Supply (total profiles)</label>
                <input
                  className="form-input"
                  type="number"
                  value={r.supply ?? 0}
                  onChange={(e) => setRegionField(i, 'supply', e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Available candidates</label>
                <input
                  className="form-input"
                  type="number"
                  value={r.available ?? 0}
                  onChange={(e) => setRegionField(i, 'available', e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="form-label">YoY Change (%)</label>
                <input
                  className="form-input"
                  type="number"
                  value={r.yoyChange ?? 0}
                  onChange={(e) => setRegionField(i, 'yoyChange', e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Market Share (%)</label>
                <input
                  className="form-input"
                  type="number"
                  value={r.marketShare ?? 0}
                  onChange={(e) => setRegionField(i, 'marketShare', e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Latitude</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.0001"
                  value={r.lat ?? 0}
                  onChange={(e) => setRegionField(i, 'lat', e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Longitude</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.0001"
                  value={r.lng ?? 0}
                  onChange={(e) => setRegionField(i, 'lng', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <button className="add-row-btn" onClick={addRegion}>
          <Plus size={14} /> Add Region
        </button>
      </section>

      {/* ── Trend Data ── */}
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Monthly Supply Trend</h3>
          <p className="form-section-desc">
            12-month supply figures per region. Column keys must match the Region IDs above.
            The last row should contain the current month values.
          </p>
        </div>

        {regions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add regions above first.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Month
                    </th>
                    {regions.map((r) => (
                      <th
                        key={r.id}
                        style={{ padding: '6px 8px', textAlign: 'center', color: r.color, fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        {r.name || r.id}
                      </th>
                    ))}
                    <th style={{ width: 32 }} />
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((row, rowIdx) => (
                    <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '4px 8px' }}>
                        <input
                          className="form-input"
                          value={row.month || ''}
                          onChange={(e) => {
                            const next = trendData.map((r, i) =>
                              i === rowIdx ? { ...r, month: e.target.value } : r
                            )
                            onChange('geoTrendData', next)
                          }}
                          style={{ width: 64 }}
                          placeholder="Jan"
                        />
                      </td>
                      {regions.map((region) => (
                        <td key={region.id} style={{ padding: '4px 8px' }}>
                          <input
                            className="form-input"
                            type="number"
                            value={row[region.id] ?? 0}
                            onChange={(e) => setTrendCell(rowIdx, region.id, e.target.value)}
                            style={{ width: 64, textAlign: 'center' }}
                          />
                        </td>
                      ))}
                      <td style={{ padding: '4px 8px' }}>
                        <button className="row-delete-btn" onClick={() => removeTrendMonth(rowIdx)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="add-row-btn" style={{ marginTop: 8 }} onClick={addTrendMonth}>
              <Plus size={14} /> Add Month
            </button>
          </>
        )}
      </section>

    </div>
  )
}
