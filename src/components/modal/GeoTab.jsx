import { Trash2, Plus } from 'lucide-react'

const ZONE_OPTIONS = ['Southeast Asia', 'East Asia', 'South Asia', 'Oceania', 'Other']

export default function GeoTab({ data, onChange, onBatch }) {
  const regions   = data.geoRegions   || []
  const trendData = data.geoTrendData || []

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
              <button className="row-delete-btn" onClick={() => removeRegion(i)} title="Remove region">
                <Trash2 size={14} />
              </button>
            </div>

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
