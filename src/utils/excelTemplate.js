// xlsx is dynamically imported inside downloadExcelTemplate so it is NOT
// included in the initial bundle — it loads only when the user clicks
// "Download Template" for the first time.
import * as mockData from '../data/mockData'

export async function downloadExcelTemplate(currentData) {
  // xlsx v0.18 ESM exposes named exports — no default export
  const { utils, writeFile } = await import('xlsx')

  const wb = utils.book_new()

  const d       = currentData || {}
  const meta    = d.reportMeta          || mockData.reportMeta
  const kpi     = d.kpiData             || mockData.kpiData
  const mktSize = d.marketSizeData      || mockData.marketSizeData
  const cap     = d.marketCapacityData  || mockData.marketCapacityData
  const funnel  = d.sourcingFunnelData  || mockData.sourcingFunnelData
  const stats   = d.sourcingStats       || mockData.sourcingStats
  const salary  = d.salaryBenchmarkData || mockData.salaryBenchmarkData
  const insights = d.keyInsightsData    || mockData.keyInsightsData
  const method  = d.methodologyData     || mockData.methodologyData
  const geoRegs = d.geoRegions          || mockData.geoRegions
  const geoTrend = d.geoTrendData       || mockData.geoTrendData

  // ── Meta ──────────────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet([
      { key: 'title',      value: meta.title },
      { key: 'role',       value: meta.role },
      { key: 'date',       value: meta.date },
      { key: 'preparedBy', value: meta.preparedBy },
      { key: 'company',    value: meta.company },
    ]), 'Meta')

  // ── KPIData ───────────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      kpi.map((r) => ({
        label: r.label, value: r.value, unit: r.unit,
        change: r.change, trend: r.trend, icon: r.icon,
      }))
    ), 'KPIData')

  // ── MarketSize ────────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      mktSize.map((r) => ({ city: r.city, size: r.size, available: r.available }))
    ), 'MarketSize')

  // ── MarketCapacity ────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      cap.map((r) => ({
        label: r.label, fullLabel: r.fullLabel,
        value: r.value, description: r.description, color: r.color,
      }))
    ), 'MarketCapacity')

  // ── SourcingFunnel ────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      funnel.map((r) => ({
        stage: r.stage, count: r.count, pct: r.pct, note: r.note, color: r.color,
      }))
    ), 'SourcingFunnel')

  // ── SourcingStats ─────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      stats.map((r) => ({ label: r.label, value: r.value, note: r.note }))
    ), 'SourcingStats')

  // ── SalaryBenchmark ───────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      salary.map((r) => ({
        location: r.location, rangeMin: r.rangeMin, rangeMax: r.rangeMax,
        currency: r.currency, basis: r.basis, sources: r.sources,
      }))
    ), 'SalaryBenchmark')

  // ── KeyInsights ───────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      insights.map((r) => ({ tag: r.tag, title: r.title, body: r.body }))
    ), 'KeyInsights')

  // ── MethodologyCriteria ───────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      (method.criteria || []).map((r) => ({ label: r.label, value: r.value }))
    ), 'MethodologyCriteria')

  // ── MethodologySources ────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      (method.sources || []).map((r) => ({
        name: r.name, confidence: r.confidence,
        sampleSize: r.sampleSize ?? '', note: r.note,
      }))
    ), 'MethodologySources')

  // ── Disclaimers ───────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      (method.disclaimers || []).map((text) => ({ text }))
    ), 'Disclaimers')

  // ── GeoRegions ────────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(
      geoRegs.map((r) => ({
        id: r.id, name: r.name, country: r.country, countryCode: r.countryCode,
        zone: r.zone, supply: r.supply, available: r.available,
        lat: r.lat, lng: r.lng, color: r.color,
        yoyChange: r.yoyChange, marketShare: r.marketShare,
      }))
    ), 'GeoRegions')

  // ── GeoTrend ──────────────────────────────────────────────
  utils.book_append_sheet(wb,
    utils.json_to_sheet(geoTrend),
    'GeoTrend')

  writeFile(wb, 'market-research-template.xlsx')
}
