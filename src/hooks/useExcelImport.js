// Maps Excel sheet names → internal data keys
// Each mapper receives an array of row objects (headers as keys)
// and returns the correctly shaped data structure.
//
// xlsx is dynamically imported inside parseExcelFile so it is NOT
// included in the initial bundle — it loads only when a file is imported.

function toNum(v) {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function toStr(v) {
  return v == null ? '' : String(v).trim()
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const { default: XLSX } = await import('xlsx')
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const result = {}

        // ── Meta ──────────────────────────────────────────────
        if (wb.SheetNames.includes('Meta')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['Meta'])
          const meta = {}
          rows.forEach((r) => { meta[toStr(r.key)] = toStr(r.value) })
          result.reportMeta = {
            title:      meta.title      || 'Talent Market Research',
            role:       meta.role       || '',
            date:       meta.date       || '',
            preparedBy: meta.preparedBy || '',
            company:    meta.company    || '',
          }
        }

        // ── KPIData ───────────────────────────────────────────
        if (wb.SheetNames.includes('KPIData')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['KPIData'])
          result.kpiData = rows.map((r) => ({
            label:  toStr(r.label),
            value:  toStr(r.value),
            unit:   toStr(r.unit),
            change: toStr(r.change),
            trend:  toStr(r.trend) || 'neutral',
            icon:   toStr(r.icon)  || 'users',
          }))
        }

        // ── MarketSize ────────────────────────────────────────
        if (wb.SheetNames.includes('MarketSize')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['MarketSize'])
          result.marketSizeData = rows.map((r) => ({
            city:      toStr(r.city),
            size:      toNum(r.size),
            available: toNum(r.available),
          }))
        }

        // ── MarketCapacity ─────────────────────────────────────
        if (wb.SheetNames.includes('MarketCapacity')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['MarketCapacity'])
          const fallbackColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd']
          result.marketCapacityData = rows.map((r, i) => ({
            label:       toStr(r.label),
            fullLabel:   toStr(r.fullLabel),
            value:       toNum(r.value),
            description: toStr(r.description),
            color:       toStr(r.color) || fallbackColors[i] || fallbackColors[fallbackColors.length - 1],
          }))
        }

        // ── SourcingFunnel ─────────────────────────────────────
        if (wb.SheetNames.includes('SourcingFunnel')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['SourcingFunnel'])
          const fallbackColors = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe']
          result.sourcingFunnelData = rows.map((r, i) => ({
            stage: toStr(r.stage),
            count: toNum(r.count),
            pct:   toNum(r.pct),
            note:  toStr(r.note),
            color: toStr(r.color) || fallbackColors[i] || fallbackColors[fallbackColors.length - 1],
          }))
        }

        // ── SourcingStats ──────────────────────────────────────
        if (wb.SheetNames.includes('SourcingStats')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['SourcingStats'])
          result.sourcingStats = rows.map((r) => ({
            label: toStr(r.label),
            value: toStr(r.value),
            note:  toStr(r.note),
          }))
        }

        // ── SalaryBenchmark ────────────────────────────────────
        if (wb.SheetNames.includes('SalaryBenchmark')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['SalaryBenchmark'])
          result.salaryBenchmarkData = rows.map((r) => ({
            location: toStr(r.location),
            rangeMin: toNum(r.rangeMin),
            rangeMax: toNum(r.rangeMax),
            currency: toStr(r.currency),
            basis:    toStr(r.basis),
            sources:  toStr(r.sources),
          }))
        }

        // ── KeyInsights ────────────────────────────────────────
        if (wb.SheetNames.includes('KeyInsights')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['KeyInsights'])
          result.keyInsightsData = rows.map((r) => ({
            tag:   toStr(r.tag),
            title: toStr(r.title),
            body:  toStr(r.body),
          }))
        }

        // ── MethodologyCriteria ────────────────────────────────
        if (wb.SheetNames.includes('MethodologyCriteria')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['MethodologyCriteria'])
          result.methodologyCriteria = rows.map((r) => ({
            label: toStr(r.label),
            value: toStr(r.value),
          }))
        }

        // ── MethodologySources ─────────────────────────────────
        if (wb.SheetNames.includes('MethodologySources')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['MethodologySources'])
          result.methodologySources = rows.map((r) => ({
            name:        toStr(r.name),
            confidence:  toNum(r.confidence),
            sampleSize:  r.sampleSize ? toNum(r.sampleSize) : null,
            note:        toStr(r.note),
          }))
        }

        // ── Disclaimers ────────────────────────────────────────
        if (wb.SheetNames.includes('Disclaimers')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['Disclaimers'])
          result.disclaimers = rows.map((r) => toStr(r.text))
        }

        // ── GeoRegions ─────────────────────────────────────────
        if (wb.SheetNames.includes('GeoRegions')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['GeoRegions'])
          result.geoRegions = rows.map((r) => ({
            id:          toStr(r.id),
            name:        toStr(r.name),
            country:     toStr(r.country),
            countryCode: toStr(r.countryCode),
            zone:        toStr(r.zone),
            supply:      toNum(r.supply),
            available:   toNum(r.available),
            lat:         toNum(r.lat),
            lng:         toNum(r.lng),
            color:       toStr(r.color) || '#6366f1',
            yoyChange:   toNum(r.yoyChange),
            marketShare: toNum(r.marketShare),
          }))
        }

        // ── GeoTrend ───────────────────────────────────────────
        if (wb.SheetNames.includes('GeoTrend')) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['GeoTrend'])
          // Each row is { month, sg, syd, hk, ... } — preserve all columns as-is,
          // coercing numeric values and keeping month as a string.
          result.geoTrendData = rows.map((r) => {
            const entry = {}
            Object.keys(r).forEach((k) => {
              entry[k] = k === 'month' ? toStr(r[k]) : toNum(r[k])
            })
            return entry
          })
        }

        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
