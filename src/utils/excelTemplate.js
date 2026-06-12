import * as XLSX from 'xlsx'
import * as mockData from '../data/mockData'

export function downloadExcelTemplate(currentData) {
  const wb = XLSX.utils.book_new()

  const d = currentData || {}
  const meta    = d.reportMeta          || mockData.reportMeta
  const mktSize = d.marketSizeData      || mockData.marketSizeData
  const cap     = d.marketCapacityData  || mockData.marketCapacityData
  const funnel  = d.sourcingFunnelData  || mockData.sourcingFunnelData
  const stats   = d.sourcingStats       || mockData.sourcingStats
  const salary  = d.salaryBenchmarkData || mockData.salaryBenchmarkData
  const insights= d.keyInsightsData     || mockData.keyInsightsData
  const method  = d.methodologyData     || mockData.methodologyData

  // ── Meta ──────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet([
      { key: 'title',      value: meta.title },
      { key: 'role',       value: meta.role },
      { key: 'date',       value: meta.date },
      { key: 'preparedBy', value: meta.preparedBy },
      { key: 'company',    value: meta.company },
    ]), 'Meta')

  // ── MarketSize ────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      mktSize.map((r) => ({ city: r.city, size: r.size, available: r.available }))
    ), 'MarketSize')

  // ── MarketCapacity ────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      cap.map((r) => ({
        label: r.label, fullLabel: r.fullLabel,
        value: r.value, description: r.description,
      }))
    ), 'MarketCapacity')

  // ── SourcingFunnel ────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      funnel.map((r) => ({
        stage: r.stage, count: r.count, pct: r.pct, note: r.note,
      }))
    ), 'SourcingFunnel')

  // ── SourcingStats ─────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      stats.map((r) => ({ label: r.label, value: r.value, note: r.note }))
    ), 'SourcingStats')

  // ── SalaryBenchmark ───────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      salary.map((r) => ({
        location: r.location, rangeMin: r.rangeMin, rangeMax: r.rangeMax,
        currency: r.currency, basis: r.basis, sources: r.sources,
      }))
    ), 'SalaryBenchmark')

  // ── KeyInsights ───────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      insights.map((r) => ({ tag: r.tag, title: r.title, body: r.body }))
    ), 'KeyInsights')

  // ── MethodologyCriteria ───────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      (method.criteria || []).map((r) => ({ label: r.label, value: r.value }))
    ), 'MethodologyCriteria')

  // ── MethodologySources ────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      (method.sources || []).map((r) => ({
        name: r.name, confidence: r.confidence,
        sampleSize: r.sampleSize ?? '', note: r.note,
      }))
    ), 'MethodologySources')

  // ── Disclaimers ───────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet(
      (method.disclaimers || []).map((text) => ({ text }))
    ), 'Disclaimers')

  XLSX.writeFile(wb, 'market-research-template.xlsx')
}
