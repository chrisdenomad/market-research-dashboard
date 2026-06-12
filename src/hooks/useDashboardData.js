import { useState, useCallback } from 'react'
import * as mockData from '../data/mockData'

const STORAGE_KEY = 'dashboard-data-v1'

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
    kpiData:             mockData.kpiData,
    marketSizeData:      mockData.marketSizeData,
    marketCapacityData:  mockData.marketCapacityData,
    sourcingFunnelData:  mockData.sourcingFunnelData,
    sourcingStats:       mockData.sourcingStats,
    salaryBenchmarkData: mockData.salaryBenchmarkData,
    keyInsightsData:     mockData.keyInsightsData,
    methodologyData:     mockData.methodologyData,
  }
}

export function useDashboardData() {
  const [data, setData] = useState(() => loadFromStorage() || buildDefaultData())
  const [isCustom, setIsCustom] = useState(() => !!loadFromStorage())

  const applyData = useCallback((newData) => {
    setData(newData)
    setIsCustom(true)
    saveToStorage(newData)
  }, [])

  const resetData = useCallback(() => {
    const defaults = buildDefaultData()
    setData(defaults)
    setIsCustom(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { data, isCustom, applyData, resetData }
}
