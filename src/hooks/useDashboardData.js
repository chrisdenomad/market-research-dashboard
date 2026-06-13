import { useState, useCallback } from 'react'
import * as mockData from '../data/mockData'

const STORAGE_KEY = 'dashboard-data-v2'

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
    .replace(/[^a-z0-9\s]/g, '')   // strip punctuation
    .split(/\s+/)                   // split on spaces
    .map((w) => w[0] || '')         // take first letter of each word
    .join('')
    .slice(0, 6)                    // cap at 6 chars
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
  // Fallback: up to 3 uppercase initials
  return city.split(/\s+/).map((w) => w[0]?.toUpperCase() || '').join('').slice(0, 3)
}

// ════════════════════════════════════════════════════════════════════════════
// MASTER DERIVE FUNCTION
// Runs on every applyData(). marketSizeData is the master datasource.
// Everything else is derived/synced from it automatically.
// ════════════════════════════════════════════════════════════════════════════
function deriveFromMarketSize(data) {
  if (!data.marketSizeData) return data
  const cities = data.marketSizeData    // [{ city, size, available }]

  // ── 1. Totals ─────────────────────────────────────────────────────────────
  const totalSize      = cities.reduce((s, r) => s + (r.size      || 0), 0)
  const totalAvailable = cities.reduce((s, r) => s + (r.available || 0), 0)
  const availRate      = totalSize ? Math.round((totalAvailable / totalSize) * 100) : 0
  const cityCount      = cities.length
  const cityAbbrList   = cities.map((r) => cityAbbr(r.city)).join(' · ')

  // ── 2. kpiData — update cards 1, 2, 3 (leave card 4 "Time to Fill" alone) ──
  const kpi = (data.kpiData || []).map((card, i) => {
    if (i === 0) return { ...card, value: String(totalSize),      change: `+${availRate}% availability rate` }
    if (i === 1) return { ...card, value: String(totalAvailable), change: `${availRate}% availability rate` }
    if (i === 2) return { ...card, value: String(cityCount),      change: cityAbbrList }
    return card   // card 3+ (e.g. Time to Fill) — untouched
  })

  // ── 3. geoRegions — sync supply/available, add new cities, keep geo-only ──
  const existingRegions = data.geoRegions || []

  // For each marketSizeData city: find match in geoRegions or create stub
  const usedIds = existingRegions.map((r) => r.id)
  const updatedRegions = [...existingRegions]

  cities.forEach((mktCity) => {
    const nameLower = mktCity.city?.toLowerCase()
    const idx = updatedRegions.findIndex((r) => r.name?.toLowerCase() === nameLower)

    if (idx >= 0) {
      // Existing region — sync supply + available
      updatedRegions[idx] = {
        ...updatedRegions[idx],
        supply:    mktCity.size      ?? updatedRegions[idx].supply,
        available: mktCity.available ?? updatedRegions[idx].available,
      }
    } else {
      // New city in marketSizeData — create a stub geoRegion
      const baseId  = cityToId(mktCity.city)
      const newId   = uniqueId(baseId, usedIds)
      usedIds.push(newId)
      const colorIndex = updatedRegions.length % GEO_COLORS.length
      updatedRegions.push({
        id:          newId,
        name:        mktCity.city,
        country:     mktCity.city,   // user can refine in Geographic section
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

  // Keep geo-only regions (not in marketSizeData) — don't remove them
  // But remove regions that were previously synced from marketSizeData if
  // their city no longer exists in marketSizeData AND they have no coordinates
  // (i.e. they were auto-created stubs, not hand-crafted geo entries).
  const marketCityNames = new Set(cities.map((c) => c.city?.toLowerCase()))
  const finalRegions = updatedRegions.filter((r) => {
    const inMarket = marketCityNames.has(r.name?.toLowerCase())
    const isStub   = !r.lat && !r.lng && !r.countryCode  // auto-created stub
    // Remove only if: it was a stub AND it's no longer in marketSizeData
    if (!inMarket && isStub) return false
    return true
  })

  // ── 4. geoTrendData — add/remove columns to match finalRegions ───────────
  const regionIds     = new Set(finalRegions.map((r) => r.id))
  const prevRegionIds = new Set(existingRegions.map((r) => r.id))

  let trendData = data.geoTrendData || []

  // Add columns for new regions
  finalRegions.forEach((r) => {
    if (!prevRegionIds.has(r.id)) {
      trendData = trendData.map((row) => ({ ...row, [r.id]: 0 }))
    }
  })

  // Remove columns for regions that no longer exist
  trendData = trendData.map((row) => {
    const next = { month: row.month }
    finalRegions.forEach((r) => { next[r.id] = row[r.id] ?? 0 })
    return next
  })

  // ── 5. marketCapacityData — update SAM (= totalSize) and SOM (= totalAvailable) ──
  const capacity = (data.marketCapacityData || []).map((tier) => {
    if (tier.label === 'SAM') return { ...tier, value: totalSize }
    if (tier.label === 'SOM') return { ...tier, value: totalAvailable }
    return tier
  })

  // ── 6. sourcingFunnelData — update stage 0 count to totalSize ────────────
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

// ────────────────────────────────────────────────────────────────────────────

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
  } catch {
    // storage quota exceeded — fail silently
  }
}

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
  }
}

export function useDashboardData() {
  const [data, setData] = useState(() => {
    const stored = loadFromStorage()
    if (!stored) return buildDefaultData()
    const defaults = buildDefaultData()
    return { ...defaults, ...stored }
  })
  const [isCustom, setIsCustom] = useState(() => !!loadFromStorage())

  const applyData = useCallback((newData) => {
    const derived = deriveFromMarketSize(newData)
    setData(derived)
    setIsCustom(true)
    saveToStorage(derived)
  }, [])

  const resetData = useCallback(() => {
    const defaults = buildDefaultData()
    setData(defaults)
    setIsCustom(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { data, isCustom, applyData, resetData }
}
