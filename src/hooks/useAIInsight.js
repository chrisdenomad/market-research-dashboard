import { useState, useEffect, useCallback, useRef } from 'react'

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

// ── Mode 2: auto-summary system prompt built from dashboard data ──
const AUTO_INSTRUCTION =
  'Write exactly 7 key-point sentences — no more, no less. ' +
  'Each sentence must be a standalone insight. Cover these topics in order: ' +
  '(1) overall talent market supply and availability rate, ' +
  '(2) which location has the strongest candidate pool and why, ' +
  '(3) TAM/SAM/SOM funnel health and what it means for hiring reach, ' +
  '(4) sourcing conversion rate and time-to-fill outlook, ' +
  '(5) salary competitiveness across locations, ' +
  '(6) the single biggest hiring risk or challenge, ' +
  '(7) a forward-looking hiring prediction or recommended next action. ' +
  'Write in plain professional language. No bullet points, no headers — just 7 flowing sentences as one paragraph.'

function buildDataContext(data) {
  const meta     = data.reportMeta          || {}
  const mktSize  = data.marketSizeData      || []
  const cap      = data.marketCapacityData  || []
  const stats    = data.sourcingStats       || []
  const salary   = data.salaryBenchmarkData || []
  const insights = data.keyInsightsData     || []

  const totalProfiles  = mktSize.reduce((s, r) => s + (r.size      || 0), 0)
  const totalAvailable = mktSize.reduce((s, r) => s + (r.available || 0), 0)
  const availRate      = totalProfiles ? Math.round((totalAvailable / totalProfiles) * 100) : 0

  const locationLines = mktSize.map((r) =>
    `  - ${r.city}: ${r.size} profiles, ${r.available} available (${r.size ? Math.round((r.available / r.size) * 100) : 0}%)`
  ).join('\n')

  const tamLine = cap.find((c) => c.label === 'TAM')
  const samLine = cap.find((c) => c.label === 'SAM')
  const somLine = cap.find((c) => c.label === 'SOM')

  const conversionStat = stats.find((s) => s.label?.toLowerCase().includes('conversion'))
  const ttfStat        = stats.find((s) => s.label?.toLowerCase().includes('time'))
  const fillStat       = stats.find((s) =>
    s.label?.toLowerCase().includes('fill') || s.label?.toLowerCase().includes('expect')
  )

  const salaryLines = salary.map((r) =>
    `  - ${r.location}: ${r.currency} ${r.rangeMin?.toLocaleString()}–${r.rangeMax?.toLocaleString()} (${r.basis})`
  ).join('\n')

  const riskInsights = insights
    .filter((i) => i.tag === 'Risk' || i.tag === 'Watch')
    .map((i) => `  - [${i.tag}] ${i.title}`).join('\n')

  const oppInsights = insights
    .filter((i) => i.tag === 'Opportunity' || i.tag === 'Trend')
    .map((i) => `  - [${i.tag}] ${i.title}`).join('\n')

  return `RESEARCH DATA:
Role: ${meta.role || 'N/A'}
Company: ${meta.company || 'N/A'}
Date: ${meta.date || 'N/A'}

MARKET SIZE:
Total profiles identified: ${totalProfiles}
Total available candidates: ${totalAvailable} (${availRate}% availability rate)
By location:
${locationLines || '  No location data'}

TALENT FUNNEL:
${tamLine ? `TAM: ${tamLine.value} profiles` : ''}
${samLine ? `SAM: ${samLine.value} profiles` : ''}
${somLine ? `SOM: ${somLine.value} candidates` : ''}

SOURCING OUTLOOK:
${conversionStat ? `Conversion rate: ${conversionStat.value}` : ''}
${ttfStat        ? `Time to fill: ${ttfStat.value}`           : ''}
${fillStat       ? `Expected fills: ${fillStat.value}`        : ''}

SALARY BENCHMARKS:
${salaryLines || '  No salary data'}

KEY RISKS & WATCHES:
${riskInsights || '  None noted'}

KEY OPPORTUNITIES & TRENDS:
${oppInsights || '  None noted'}`
}

// Mode 1 — user's free-form prompt, no data context injected unless they include it
function buildManualPrompt(userPrompt) {
  return userPrompt.trim()
}

// Mode 2 — structured data + fixed 7-sentence instruction, with optional custom focus appended
function buildSummaryPrompt(data, customInstruction) {
  const focusClause = customInstruction?.trim()
    ? ` Additionally, pay special attention to: ${customInstruction.trim()}`
    : ''
  const instruction = AUTO_INSTRUCTION + focusClause
  return `You are a senior talent market research analyst. Based on the recruitment market research data below, respond to the following instruction:\n\nINSTRUCTION:\n${instruction}\n\n${buildDataContext(data)}`
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

export function useAIInsight(data) {
  const [apiKey,            setApiKeyState]       = useState(getStoredApiKey)
  const [customInstruction, setCustomInstruction] = useState(getStoredInstruction)
  const [mode,              setModeState]         = useState(() => localStorage.getItem(MODE_KEY) || 'summary')

  // Mode 1 — manual
  const [manualOutput,  setManualOutput]  = useState(null)
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError,   setManualError]   = useState(null)
  const manualAbortRef = useRef(null)

  // Mode 2 — summary
  const [summary,      setSummary]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const summaryAbortRef = useRef(null)

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
      const text = await callGithubModels(key, buildSummaryPrompt(data, instruction), summaryAbortRef.current.signal)
      setSummary(text)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'unknown')
    } finally {
      setLoading(false)
    }
  }, [data, apiKey, customInstruction]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate summary when key/data changes
  const dataHash = JSON.stringify({
    reportMeta:          data.reportMeta,
    marketSizeData:      data.marketSizeData,
    keyInsightsData:     data.keyInsightsData,
    salaryBenchmarkData: data.salaryBenchmarkData,
  })
  const prevHashRef = useRef(null)

  useEffect(() => {
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
    customInstruction, updateInstruction,
    // mode 1 — manual
    manualOutput, manualLoading, manualError, generateManual,
    // mode 2 — summary
    summary, loading, error, generate,
  }
}
