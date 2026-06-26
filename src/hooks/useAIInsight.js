import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

const STORAGE_KEY      = 'github-ai-token'
const INSTRUCTION_KEY  = 'ai-custom-instruction'
const MODE_KEY         = 'ai-mode'

export function getStoredApiKey() {
  return localStorage.getItem(STORAGE_KEY) || ''
}
export function saveApiKey(key) {
  if (key) localStorage.setItem(STORAGE_KEY, key)
  else localStorage.removeItem(STORAGE_KEY)
}
export function getStoredInstruction() {
  return localStorage.getItem(INSTRUCTION_KEY) || ''
}
export function saveInstruction(val) {
  if (val) localStorage.setItem(INSTRUCTION_KEY, val)
  else localStorage.removeItem(INSTRUCTION_KEY)
}

// GitHub Models — OpenAI-compatible
const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions'
const MODEL = 'gpt-4o-mini'

// ── Widget ID → data section key mapping ─────────────────────────────────────
// This is the same map used in App.jsx WIDGET_SECTION, mirrored here so the
// hook can derive which sections are currently visible without importing App.
const WIDGET_TO_SECTION = {
  'kpi':              'report',
  'market-size':      'marketsize',
  'market-capacity':  'capacity',
  'sourcing':         'sourcing',
  'key-insights':     'insights',
  'benchmark':        'rates',
  'geo-distribution': 'geo',
  'methodology':      'methodology',
}

// ── Derive the set of data sections that are both visible and have data ───────
// visibleWidgets: string[] of widget IDs currently shown on the dashboard
// providedSections: string[] of section keys the user has supplied data for
function resolveVisibleSections(visibleWidgets, providedSections) {
  const provided = new Set(providedSections || [])
  const visible  = new Set()
  ;(visibleWidgets || []).forEach((widgetId) => {
    const sectionKey = WIDGET_TO_SECTION[widgetId]
    if (sectionKey && provided.has(sectionKey)) visible.add(sectionKey)
  })
  return visible
}

// ── Build dynamic instruction from the currently visible sections ─────────────
function buildInstruction(visibleSections) {
  const topics = []
  let idx = 1

  // Always include the market size overview if visible
  if (visibleSections.has('marketsize') || visibleSections.has('report')) {
    topics.push(`(${idx++}) overall talent market supply and candidate availability rate`)
  }
  if (visibleSections.has('marketsize')) {
    topics.push(`(${idx++}) which location has the strongest candidate pool and why`)
  }
  if (visibleSections.has('capacity')) {
    topics.push(`(${idx++}) TAM/SAM/SOM funnel health and what it means for hiring reach`)
  }
  if (visibleSections.has('sourcing')) {
    topics.push(`(${idx++}) sourcing conversion rate and time-to-fill outlook`)
  }
  if (visibleSections.has('rates')) {
    topics.push(`(${idx++}) salary competitiveness across locations`)
  }
  if (visibleSections.has('insights')) {
    topics.push(`(${idx++}) the single biggest hiring risk or challenge highlighted in the insights`)
  }
  if (visibleSections.has('geo')) {
    topics.push(`(${idx++}) geographic market distribution and year-over-year supply trends`)
  }

  // Always end with a forward-looking recommendation
  topics.push(`(${idx++}) a forward-looking hiring prediction or recommended next action`)

  const topicList  = topics.join(', ')
  const sentenceCount = topics.length

  return (
    `Write exactly ${sentenceCount} key-point sentences — no more, no less. ` +
    `Each sentence must be a standalone insight. Cover these topics in order: ${topicList}. ` +
    `Only reference the data sections explicitly provided below — do not invent or assume data for sections not present. ` +
    `Write in plain professional language. No bullet points, no headers — just ${sentenceCount} flowing sentences as one paragraph.`
  )
}

// ── Build data context — only include sections that are visible ───────────────
function buildDataContext(data, visibleSections) {
  const meta     = data.reportMeta          || {}
  const mktSize  = data.marketSizeData      || []
  const cap      = data.marketCapacityData  || []
  const stats    = data.sourcingStats       || []
  const funnel   = data.sourcingFunnelData  || []
  const salary   = data.salaryBenchmarkData || []
  const insights = data.keyInsightsData     || []
  const geo      = data.geoRegions          || []

  const showMarketSize = visibleSections.has('marketsize') || visibleSections.has('report')
  const showCapacity   = visibleSections.has('capacity')
  const showSourcing   = visibleSections.has('sourcing')
  const showRates      = visibleSections.has('rates')
  const showInsights   = visibleSections.has('insights')
  const showGeo        = visibleSections.has('geo')

  const lines = []

  lines.push('RESEARCH DATA:')
  lines.push(`Role: ${meta.role || 'N/A'}`)
  lines.push(`Company: ${meta.company || 'N/A'}`)
  lines.push(`Date: ${meta.date || 'N/A'}`)

  // ── Market Size ──────────────────────────────────────────────────────────
  if (showMarketSize && mktSize.length > 0) {
    const totalProfiles  = mktSize.reduce((s, r) => s + (r.size      || 0), 0)
    const totalAvailable = mktSize.reduce((s, r) => s + (r.available || 0), 0)
    const availRate      = totalProfiles ? Math.round((totalAvailable / totalProfiles) * 100) : 0

    lines.push('')
    lines.push('MARKET SIZE:')
    lines.push(`Total profiles identified: ${totalProfiles}`)
    lines.push(`Total available candidates: ${totalAvailable} (${availRate}% availability rate)`)
    lines.push('By location:')
    mktSize.forEach((r) => {
      const pct = r.size ? Math.round((r.available / r.size) * 100) : 0
      lines.push(`  - ${r.city}: ${r.size} profiles, ${r.available} available (${pct}%)`)
    })
  }

  // ── Extra geo markets (only if geo section is visible) ──────────────────
  if (showGeo && geo.length > 0) {
    const primaryCities = new Set(mktSize.map((m) => m.city?.toLowerCase()))
    const extraGeo = geo.filter((r) => !primaryCities.has(r.name?.toLowerCase()))
    if (extraGeo.length > 0) {
      lines.push('')
      lines.push('ADDITIONAL MARKETS:')
      extraGeo.forEach((r) => {
        const sign = r.yoyChange >= 0 ? '+' : ''
        lines.push(`  - ${r.name} (${r.country}): ${r.supply} profiles, ${r.available} available, YoY ${sign}${r.yoyChange}%`)
      })
    }
  }

  // ── Talent Funnel / Market Capacity ─────────────────────────────────────
  if (showCapacity && cap.length > 0) {
    lines.push('')
    lines.push('TALENT FUNNEL:')
    cap.forEach((c) => {
      if (c.label && c.value !== undefined) {
        lines.push(`${c.label}: ${c.value}${c.description ? ' — ' + c.description : ''}`)
      }
    })
  }

  // ── Sourcing Funnel ──────────────────────────────────────────────────────
  if (showSourcing && funnel.length > 0) {
    lines.push('')
    lines.push('SOURCING FUNNEL (conversion pipeline):')
    funnel.forEach((f) => {
      lines.push(`  - ${f.stage}: ${f.count} (${f.pct}%)${f.note ? ' — ' + f.note : ''}`)
    })
  }

  // ── Sourcing Stats ───────────────────────────────────────────────────────
  if (showSourcing && stats.length > 0) {
    lines.push('')
    lines.push('SOURCING OUTLOOK:')
    const conversionStat = stats.find((s) => s.label?.toLowerCase().includes('conversion'))
    const ttfStat        = stats.find((s) => s.label?.toLowerCase().includes('time'))
    const fillStat       = stats.find((s) =>
      s.label?.toLowerCase().includes('fill') || s.label?.toLowerCase().includes('expect')
    )
    if (conversionStat) lines.push(`Conversion rate: ${conversionStat.value}`)
    if (ttfStat)        lines.push(`Time to fill: ${ttfStat.value}`)
    if (fillStat)       lines.push(`Expected fills: ${fillStat.value}`)
  }

  // ── Salary Benchmarks ────────────────────────────────────────────────────
  if (showRates && salary.length > 0) {
    lines.push('')
    lines.push('SALARY BENCHMARKS:')
    salary.forEach((r) => {
      lines.push(`  - ${r.location}: ${r.currency} ${r.rangeMin?.toLocaleString()}–${r.rangeMax?.toLocaleString()} (${r.basis})`)
    })
  }

  // ── Key Insights ─────────────────────────────────────────────────────────
  if (showInsights && insights.length > 0) {
    const risks = insights.filter((i) => i.tag === 'Risk' || i.tag === 'Watch')
    const opps  = insights.filter((i) => i.tag === 'Opportunity' || i.tag === 'Trend')

    if (risks.length > 0) {
      lines.push('')
      lines.push('KEY RISKS & WATCHES:')
      risks.forEach((i) => lines.push(`  - [${i.tag}] ${i.title}`))
    }
    if (opps.length > 0) {
      lines.push('')
      lines.push('KEY OPPORTUNITIES & TRENDS:')
      opps.forEach((i) => lines.push(`  - [${i.tag}] ${i.title}`))
    }
  }

  return lines.join('\n')
}

// ── Build the full summary prompt ─────────────────────────────────────────────
function buildSummaryPrompt(data, visibleSections, customInstruction) {
  const instruction  = buildInstruction(visibleSections)
  const focusClause  = customInstruction?.trim()
    ? ` Additionally, pay special attention to: ${customInstruction.trim()}`
    : ''
  const dataContext  = buildDataContext(data, visibleSections)

  return (
    `You are a senior talent market research analyst. Based on the recruitment market research data below, respond to the following instruction:\n\n` +
    `INSTRUCTION:\n${instruction}${focusClause}\n\n` +
    `${dataContext}`
  )
}

// Mode 1 — user's free-form prompt, no data context injected
function buildManualPrompt(userPrompt) {
  return userPrompt.trim()
}

async function callGithubModels(key, prompt, signal) {
  const res = await fetch(GITHUB_MODELS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    signal,
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401 || res.status === 403) throw new Error('invalid-key')
    if (res.status === 429) throw new Error('rate-limit')
    throw new Error(body?.error?.message || `API error ${res.status}`)
  }

  const json = await res.json()
  return json?.choices?.[0]?.message?.content?.trim() || 'No response returned.'
}

// ── visibleSections set → stable string for use in dependency arrays ──────────
function sectionsKey(set) {
  return [...set].sort().join(',')
}

export function useAIInsight(data, visibleWidgets) {
  const [apiKey,            setApiKeyState]       = useState(getStoredApiKey)
  const [customInstruction, setCustomInstruction] = useState(getStoredInstruction)
  const [mode,              setModeState]         = useState(() => localStorage.getItem(MODE_KEY) || 'summary')

  // Mode 1 — manual
  const [manualOutput,  setManualOutput]  = useState(null)
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError,   setManualError]   = useState(null)
  const manualAbortRef = useRef(null)

  // Mode 2 — summary
  const [summary,  setSummary]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const summaryAbortRef = useRef(null)

  // Derive the set of sections that are both visible AND have data
  const visibleSections = useMemo(
    () => resolveVisibleSections(visibleWidgets, data.providedSections),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(visibleWidgets), JSON.stringify(data.providedSections)]
  )

  // ── Mode 1: run any free-form prompt ──────────────────────────
  const generateManual = useCallback(async (userPrompt, keyOverride) => {
    const key = keyOverride ?? apiKey
    if (!key) { setManualError('no-key'); return }
    if (!userPrompt?.trim()) { setManualError('empty-prompt'); return }

    if (manualAbortRef.current) manualAbortRef.current.abort()
    manualAbortRef.current = new AbortController()

    setManualLoading(true)
    setManualError(null)
    setManualOutput(null)

    try {
      const text = await callGithubModels(key, buildManualPrompt(userPrompt), manualAbortRef.current.signal)
      setManualOutput(text)
    } catch (err) {
      if (err.name === 'AbortError') return
      setManualError(err.message || 'unknown')
    } finally {
      setManualLoading(false)
    }
  }, [apiKey])

  // ── Mode 2: generate structured summary from dataset ─────────
  const generate = useCallback(async (keyOverride, instructionOverride) => {
    const key         = keyOverride         ?? apiKey
    const instruction = instructionOverride ?? customInstruction

    if (!key) { setError('no-key'); return }

    if (summaryAbortRef.current) summaryAbortRef.current.abort()
    summaryAbortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setSummary(null)

    try {
      const text = await callGithubModels(
        key,
        buildSummaryPrompt(data, visibleSections, instruction),
        summaryAbortRef.current.signal
      )
      setSummary(text)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'unknown')
    } finally {
      setLoading(false)
    }
  }, [data, visibleSections, apiKey, customInstruction]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stable hash of AI-relevant data fields + currently visible sections
  const dataHash = useMemo(() => JSON.stringify({
    reportMeta:          data.reportMeta,
    marketSizeData:      data.marketSizeData,
    marketCapacityData:  data.marketCapacityData,
    sourcingFunnelData:  data.sourcingFunnelData,
    sourcingStats:       data.sourcingStats,
    keyInsightsData:     data.keyInsightsData,
    salaryBenchmarkData: data.salaryBenchmarkData,
    geoRegions:          data.geoRegions,
    _visibleSections:    sectionsKey(visibleSections),
  }), [
    data.reportMeta,
    data.marketSizeData,
    data.marketCapacityData,
    data.sourcingFunnelData,
    data.sourcingStats,
    data.keyInsightsData,
    data.salaryBenchmarkData,
    data.geoRegions,
    visibleSections,
  ])

  const prevHashRef = useRef(null)

  // On mount: if a key is already saved, auto-generate immediately
  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (hasMountedRef.current) return
    hasMountedRef.current = true
    if (apiKey) {
      prevHashRef.current = dataHash
      generate(apiKey)
    } else {
      setError('no-key')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-generate when data or visible sections change (but not on first mount)
  useEffect(() => {
    if (!hasMountedRef.current) return
    if (!apiKey) { setError('no-key'); return }
    if (prevHashRef.current === dataHash) return
    prevHashRef.current = dataHash
    generate()
  }, [apiKey, dataHash]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateApiKey(key) {
    saveApiKey(key)
    setApiKeyState(key)
    if (key) generate(key)
    else { setError('no-key'); setManualError('no-key') }
  }

  function updateInstruction(val) {
    saveInstruction(val)
    setCustomInstruction(val)
  }

  function setMode(m) {
    localStorage.setItem(MODE_KEY, m)
    setModeState(m)
  }

  return {
    // shared
    apiKey, updateApiKey, mode, setMode,
    hasKey: !!apiKey,
    customInstruction, updateInstruction,
    // mode 1 — manual
    manualOutput, manualLoading, manualError, generateManual,
    // mode 2 — summary
    summary, loading, error, generate,
    // expose for AIInsightCard subtitle
    visibleSections,
  }
}
