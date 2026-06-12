import { createContext, useContext } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const store = useDashboardData()
  return <DataContext.Provider value={store}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
