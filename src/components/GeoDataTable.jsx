import { useState } from 'react'
import { Search, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const COLUMNS = [
  { key: 'name',        label: 'Region',        sortable: true },
  { key: 'zone',        label: 'Zone',          sortable: true },
  { key: 'supply',      label: 'Supply',        sortable: true },
  { key: 'available',   label: 'Available',     sortable: true },
  { key: 'availRate',   label: 'Avail. Rate',   sortable: true },
  { key: 'marketShare', label: 'Market Share',  sortable: true },
  { key: 'yoyChange',   label: 'YoY Change',    sortable: true },
]

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ArrowUpDown size={11} style={{ opacity: 0.35 }} />
  return sortDir === 'asc'
    ? <ArrowUp size={11} style={{ color: 'var(--accent)' }} />
    : <ArrowDown size={11} style={{ color: 'var(--accent)' }} />
}

export default function GeoDataTable({ regions, selectedRegions, onExport }) {
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState('supply')
  const [sortDir, setSortDir] = useState('desc')

  const displayRegions = (selectedRegions.length > 0
    ? regions.filter((r) => selectedRegions.includes(r.id))
    : regions
  )
    .map((r) => ({
      ...r,
      availRate: Math.round((r.available / r.supply) * 100),
    }))
    .filter((r) =>
      search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.zone.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  function YoyBadge({ value }) {
    if (value > 5)  return <span className="geo-badge geo-badge-up">   <TrendingUp   size={10} /> +{value}%</span>
    if (value < -2) return <span className="geo-badge geo-badge-down"> <TrendingDown size={10} /> {value}%</span>
    return               <span className="geo-badge geo-badge-flat"><Minus         size={10} /> {value >= 0 ? '+' : ''}{value}%</span>
  }

  return (
    <div className="geo-table-wrap">
      {/* Toolbar */}
      <div className="geo-table-toolbar">
        <div className="geo-table-search">
          <Search size={13} />
          <input
            className="geo-table-input"
            placeholder="Search region, zone, country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="geo-table-meta">
          {displayRegions.length} region{displayRegions.length !== 1 ? 's' : ''}
        </div>
        <button className="geo-export-btn" onClick={onExport} title="Export filtered data as CSV">
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="geo-table-scroll">
        <table className="data-table geo-data-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={col.sortable ? 'geo-th-sortable' : ''}
                >
                  {col.label}
                  {col.sortable && (
                    <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRegions.map((region, i) => (
              <tr key={region.id} className={i % 2 === 0 ? '' : 'geo-row-alt'}>
                <td>
                  <div className="geo-region-cell">
                    <span className="geo-region-color" style={{ background: region.color }} />
                    <div>
                      <strong>{region.name}</strong>
                      <span className="geo-region-country">{region.country}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-purple" style={{ fontSize: 11 }}>{region.zone}</span>
                </td>
                <td>
                  <div className="geo-supply-cell">
                    <strong>{region.supply}</strong>
                    <div className="geo-mini-bar-bg">
                      <div
                        className="geo-mini-bar-fill"
                        style={{
                          width: `${(region.supply / Math.max(...regions.map((r) => r.supply))) * 100}%`,
                          background: region.color,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>{region.available}</td>
                <td>
                  <span className={`badge ${region.availRate >= 45 ? 'badge-green' : region.availRate >= 35 ? 'badge-blue' : 'badge-purple'}`}>
                    {region.availRate}%
                  </span>
                </td>
                <td>
                  <div className="geo-share-cell">
                    {region.marketShare}%
                    <div className="geo-mini-bar-bg">
                      <div
                        className="geo-mini-bar-fill"
                        style={{ width: `${region.marketShare}%`, background: region.color }}
                      />
                    </div>
                  </div>
                </td>
                <td><YoyBadge value={region.yoyChange} /></td>
              </tr>
            ))}
            {displayRegions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  No regions match your search.
                </td>
              </tr>
            )}
          </tbody>
          {displayRegions.length > 0 && (
            <tfoot>
              <tr className="table-total">
                <td><strong>Total</strong></td>
                <td></td>
                <td><strong>{displayRegions.reduce((s, r) => s + r.supply, 0)}</strong></td>
                <td><strong>{displayRegions.reduce((s, r) => s + r.available, 0)}</strong></td>
                <td>
                  <span className="badge badge-green">
                    {Math.round(
                      (displayRegions.reduce((s, r) => s + r.available, 0) /
                       displayRegions.reduce((s, r) => s + r.supply, 0)) * 100
                    )}%
                  </span>
                </td>
                <td>
                  <strong>
                    {displayRegions.reduce((s, r) => s + r.marketShare, 0).toFixed(1)}%
                  </strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
