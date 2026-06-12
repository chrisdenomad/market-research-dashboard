import { useState, useEffect } from 'react'

const navItems = [
  { id: 'kpi',         label: 'Overview' },
  { id: 'market-size', label: 'Market Size' },
  { id: 'capacity',    label: 'Market Capacity' },
  { id: 'sourcing',    label: 'Sourcing Outlook' },
  { id: 'insights',    label: 'Key Insights' },
  { id: 'benchmark',   label: 'Market Rates' },
  { id: 'methodology', label: 'Methodology' },
]

export default function Sidebar() {
  const [active, setActive] = useState('kpi')

  useEffect(() => {
    const observers = []
    navItems.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            className={`sidebar-item ${active === id ? 'active' : ''}`}
            onClick={() => scrollTo(id)}
          >
            <span className="sidebar-indicator" />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p className="sidebar-footer-text">Talent Market Research Dashboard</p>
        <p className="sidebar-footer-text" style={{ opacity: 0.5 }}>v1.0</p>
      </div>
    </aside>
  )
}
