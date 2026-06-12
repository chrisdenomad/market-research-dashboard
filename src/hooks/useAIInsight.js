import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'gemini-api-key'

export function getStoredApiKey() {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function saveApiKey(key) {
  if (key) localStorage.setItem(STORAGE_KEY, key)
  else localStorage.removeItem(STORAGE_KEY)
}

// Builds a concise but data-rich prompt from dashboard data
function buildPrompt(data) {
  const meta     = data.reportMeta          || {}
  const mktSize  = data.marketSizeData      || []
  const cap      = data.marketCapacityData  || []
  const stats    = data.sourcingStats       || []
  const salary   = data.salaryBenchmarkData || []
  const insights = data.keyInsightsData     || []

  const totalProfiles  = mktSize.reduce((s, r) => s + (r.size      || 0), 0)
  const totalAvailable = mktSize.reduce((s, r) => s + (r.available || 0), 0)
  const availRate      = totalProfiles
    ? Math.round((totalAvailable / totalProfiles) * 100)
    : 0

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
    .map((i) => `  - [${i.tag}] ${i.title}`)
    .join('\n')

  const oppInsights = insights
    .filter((i) => i.tag === 'Opportunity' || i.tag === 'Trend')
    .map((i) => `  - [${i.tag}] ${i.title}`)
    .join('\n')

  return `You are a senior talent market research analyst. Based on the following recruitment market research data, write a concise executive market overview (4–5 sentences, ~120 words). Cover: (1) overall market health, (2) which location offers better hiring conditions and why, (3) key risks or challenges, (4) salary competitiveness. Write in professional but approachable language. Do not use bullet points — write in flowing prose.

RESEARCH DATA:
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

export function useAIInsight(data) {
  const [summary,      setSummary]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [apiKey,       setApiKeyState]  = useState(getStoredApiKey)
  const abortRef = useRef(null)

  const generate = useCallback(async (keyOverride) => {
    const key = keyOverride ?? apiKey
    if (!key) {
      setError('no-key')
      return
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setSummary(null)

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(data) }] }],
          generationConfig: {
            maxOutputTokens: 350,
            temperature: 0.6,
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 400) throw new Error('invalid-key')
        if (res.status === 403) throw new Error('invalid-key')
        if (res.status === 429) throw new Error('rate-limit')
        throw new Error(body?.error?.message || `API error ${res.status}`)
      }

      const json = await res.json()
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      setSummary(text || 'No summary returned.')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'unknown')
    } finally {
      setLoading(false)
    }
  }, [data, apiKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate when key is set and relevant data changes
  const dataHash = JSON.stringify({
    reportMeta:         data.reportMeta,
    marketSizeData:     data.marketSizeData,
    keyInsightsData:    data.keyInsightsData,
    salaryBenchmarkData:data.salaryBenchmarkData,
  })
  const prevHashRef = useRef(null)

  useEffect(() => {
    if (!apiKey) {
      setError('no-key')
      return
    }
    if (prevHashRef.current === dataHash) return
    prevHashRef.current = dataHash
    generate()
  }, [apiKey, dataHash]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateApiKey(key) {
    saveApiKey(key)
    setApiKeyState(key)
    // Trigger generation immediately with the new key
    if (key) generate(key)
    else setError('no-key')
  }

  return { summary, loading, error, generate, apiKey, updateApiKey }
}
