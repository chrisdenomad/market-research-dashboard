import { useState, useCallback, useRef } from 'react'
import * as mockData from '../data/mockData'

const STORAGE_KEY = 'dashboard-data-v3'

// ── Colour palette for auto-created geo regions ───────────────────────────────
const GEO_COLORS = [
  '#6366f1','#8b5cf6','#a78bfa','#c4b5fd',
  '#7c3aed','#4f46e5','#818cf8','#6d28d9',
  '#10b981','#f59e0b','#ef4444','#3b82f6',
]

// ── City name → short ID (e.g. "Ho Chi Minh City" → "hcm") ──────────────────
function cityToId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 6)
    || 'city'
}

// ── Ensure ID is unique within the existing regions list ─────────────────────
function uniqueId(base, existingIds) {
  if (!existingIds.includes(base)) return base
  let i = 2
  while (existingIds.includes(`${base}${i}`)) i++
  return `${base}${i}`
}

// ── City abbreviation for KPI card (e.g. "Singapore" → "SG") ────────────────
function cityAbbr(city) {
  const overrides = {
    'singapore': 'SG', 'sydney': 'SYD', 'hong kong': 'HKG',
    'kuala lumpur': 'KL', 'tokyo': 'TKY', 'bangalore': 'BLR',
    'manila': 'MNL', 'auckland': 'AKL', 'ho chi minh city': 'HCM',
    'hanoi': 'HAN', 'jakarta': 'JKT', 'bangkok': 'BKK',
    'seoul': 'SEL', 'taipei': 'TPE', 'mumbai': 'BOM',
    'delhi': 'DEL', 'new delhi': 'DEL', 'beijing': 'BJS',
    'shanghai': 'SHA', 'shenzhen': 'SZX',
  }
  const key = city.toLowerCase().trim()
  if (overrides[key]) return overrides[key]
  return city.split(/\s+/).map((w) => w[0]?.toUpperCase() || '').join('').slice(0, 3)
}

// ════════════════════════════════════════════════════════════════════════════
// MASTER DERIVE FUNCTION
// ════════════════════════════════════════════════════════════════════════════
function deriveFromMarketSize(data) {
  if (!data.marketSizeData) return data
  const cities = data.marketSizeData

  const totalSize      = cities.reduce((s, r) => s + (r.size      || 0), 0)
  const totalAvailable = cities.reduce((s, r) => s + (r.available || 0), 0)
  const availRate      = totalSize ? Math.round((totalAvailable / totalSize) * 100) : 0
  const cityCount      = cities.length
  const cityAbbrList   = cities.map((r) => cityAbbr(r.city)).join(' · ')

  const kpi = (data.kpiData || []).map((card, i) => {
    if (i === 0) return { ...card, value: String(totalSize),      change: `+${availRate}% availability rate` }
    if (i === 1) return { ...card, value: String(totalAvailable), change: `${availRate}% availability rate` }
    if (i === 2) return { ...card, value: String(cityCount),      change: cityAbbrList }
    return card
  })

  const existingRegions = data.geoRegions || []
  const usedIds = existingRegions.map((r) => r.id)
  const updatedRegions = [...existingRegions]

  cities.forEach((mktCity) => {
    const nameLower = mktCity.city?.toLowerCase()
    const idx = updatedRegions.findIndex((r) => r.name?.toLowerCase() === nameLower)

    if (idx >= 0) {
      updatedRegions[idx] = {
        ...updatedRegions[idx],
        supply:    mktCity.size      ?? updatedRegions[idx].supply,
        available: mktCity.available ?? updatedRegions[idx].available,
      }
    } else {
      const baseId     = cityToId(mktCity.city)
      const newId      = uniqueId(baseId, usedIds)
      usedIds.push(newId)
      const colorIndex = updatedRegions.length % GEO_COLORS.length
      updatedRegions.push({
        id:          newId,
        name:        mktCity.city,
        country:     mktCity.city,
        countryCode: '',
        zone:        'Southeast Asia',
        supply:      mktCity.size      || 0,
        available:   mktCity.available || 0,
        lat:         0,
        lng:         0,
        color:       GEO_COLORS[colorIndex],
        yoyChange:   0,
        marketShare: totalSize ? Math.round((mktCity.size / totalSize) * 1000) / 10 : 0,
      })
    }
  })

  const marketCityNames = new Set(cities.map((c) => c.city?.toLowerCase()))
  const finalRegions = updatedRegions.filter((r) => {
    // Always keep manually-added regions (real coordinates or countryCode set)
    const isManual = (r.lat !== 0 || r.lng !== 0) || (r.countryCode && r.countryCode !== '')
    if (isManual) return true
    // Only remove auto-created stubs that no longer have a matching market size city
    return marketCityNames.has(r.name?.toLowerCase())
  })

  const prevRegionIds = new Set(existingRegions.map((r) => r.id))
  let trendData = data.geoTrendData || []

  finalRegions.forEach((r) => {
    if (!prevRegionIds.has(r.id)) {
      trendData = trendData.map((row) => ({ ...row, [r.id]: 0 }))
    }
  })

  trendData = trendData.map((row) => {
    const next = { month: row.month }
    finalRegions.forEach((r) => { next[r.id] = row[r.id] ?? 0 })
    return next
  })

  const capacity = (data.marketCapacityData || []).map((tier) => {
    if (tier.label === 'SAM') return { ...tier, value: totalSize }
    if (tier.label === 'SOM') return { ...tier, value: totalAvailable }
    return tier
  })

  const funnel = (data.sourcingFunnelData || []).map((stage, i) => {
    if (i === 0) return { ...stage, count: totalSize, pct: 100 }
    return stage
  })

  return {
    ...data,
    kpiData:             kpi,
    geoRegions:          finalRegions,
    geoTrendData:        trendData,
    marketCapacityData:  capacity,
    sourcingFunnelData:  funnel,
  }
}

// ── Storage helpers ──────────────────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* quota exceeded — fail silently */ }
}

// Empty shell — no pre-filled data, all sections blank
function buildEmptyData() {
  return {
    reportMeta:          { title: '', role: '', date: '', preparedBy: '', company: '' },
    widgetTitles:        mockData.widgetTitles,
    kpiData:             mockData.kpiData,          // KPI cards always use structure from mockData
    marketSizeData:      [],
    marketCapacityData:  [],
    sourcingFunnelData:  [],
    sourcingStats:       [],
    salaryBenchmarkData: [],
    keyInsightsData:     [],
    methodologyData:     { criteria: [], sources: [], disclaimers: [] },
    geoRegions:          [],
    geoTrendData:        [],
    countryBounds:       mockData.countryBounds,
    // providedSections: which data sections the user has explicitly supplied.
    // Widgets only render when their section is in this set.
    // null = no data provided yet (fresh state).
    providedSections:    null,
  }
}

// Full default data with example dataset — shown on first visit
function buildDefaultData() {
  return {
    reportMeta:          mockData.reportMeta,
    widgetTitles:        mockData.widgetTitles,
    kpiData:             mockData.kpiData,
    marketSizeData:      mockData.marketSizeData,
    marketCapacityData:  mockData.marketCapacityData,
    sourcingFunnelData:  mockData.sourcingFunnelData,
    sourcingStats:       mockData.sourcingStats,
    salaryBenchmarkData: mockData.salaryBenchmarkData,
    keyInsightsData:     mockData.keyInsightsData,
    methodologyData:     mockData.methodologyData,
    geoRegions:          mockData.geoRegions,
    geoTrendData:        mockData.geoTrendData,
    countryBounds:       mockData.countryBounds,
    // All sections provided — show the full demo dashboard on first visit
    providedSections: ['report', 'marketsize', 'capacity', 'sourcing', 'insights', 'rates', 'geo', 'methodology'],
  }
}

// ════════════════════════════════════════════════════════════════════════════
export function useDashboardData() {
  const [data, setData] = useState(() => {
    const stored = loadFromStorage()
    if (stored) {
      const defaults = buildDefaultData()
      return { ...defaults, ...stored }
    }
    return buildDefaultData()
  })

  // Keep one snapshot for undo (null = nothing to undo)
  const [prevData, setPrevData] = useState(null)
  // Incremented on every applyData call — lets consumers detect each save event
  const [saveCount, setSaveCount] = useState(0)

  // Ref that always holds the latest data so applyData can snapshot it
  // without nesting setPrevData inside setData's updater (a React anti-pattern).
  const dataRef = useRef(data)
  dataRef.current = data

  // applyData: called from DataModal (Apply button) or Excel import.
  const applyData = useCallback((newData, sections = null) => {
    // Snapshot current data BEFORE updating — read from ref so we always get
    // the latest value regardless of closure staleness.
    const snapshot = dataRef.current
    setPrevData(snapshot)

    const existing = new Set(snapshot.providedSections || [])
    if (sections) sections.forEach((s) => existing.add(s))
    if (newData.providedSections) {
      newData.providedSections.forEach((s) => existing.add(s))
    }

    const merged  = { ...newData, providedSections: [...existing] }
    const derived = deriveFromMarketSize(merged)
    saveToStorage(derived)
    setData(derived)
    setSaveCount((n) => n + 1)
  }, [])

  // undoData: revert to the snapshot saved before the last applyData call
  const undoData = useCallback(() => {
    if (!prevData) return
    setData(prevData)
    saveToStorage(prevData)
    setPrevData(null)
  }, [prevData])

  const resetData = useCallback(() => {
    const defaults = buildDefaultData()
    setData(defaults)
    setPrevData(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { data, applyData, undoData, canUndo: prevData !== null, resetData, saveCount }
}
