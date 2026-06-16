import { useData } from '../context/DataContext'

export default function MarketRateBenchmark() {
  const { data } = useData()
  const provided = data.providedSections
  if (!provided || !provided.includes('rates')) return null
  const salaryBenchmarkData = data.salaryBenchmarkData || []
  const titles = data.widgetTitles || {}
  return (
    <div className="card" id="benchmark">
      <div className="card-header">
        <div>
          <h2 className="card-title">{titles.benchmark || 'Market Rate Benchmark'}</h2>
          <p className="card-subtitle">Salary ranges by location based on hiring platform data</p>
        </div>
        <span className="card-badge">Compensation</span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Salary Range</th>
              <th>Currency</th>
              <th>Basis</th>
              <th>Sources</th>
            </tr>
          </thead>
          <tbody>
            {salaryBenchmarkData.map((row) => (
              <tr key={row.location}>
                <td><strong>{row.location}</strong></td>
                <td>
                  <span className="salary-range">
                    {row.rangeMin.toLocaleString()} – {row.rangeMax.toLocaleString()}
                  </span>
                </td>
                <td>
                  <span className="badge badge-purple">{row.currency}</span>
                </td>
                <td>{row.basis}</td>
                <td className="text-muted">{row.sources}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="benchmark-cards">
        {salaryBenchmarkData.map((row) => (
          <div key={row.location} className="benchmark-card">
            <p className="benchmark-location">{row.location}</p>
            <p className="benchmark-salary">
              {row.currency} {row.rangeMin.toLocaleString()} – {row.rangeMax.toLocaleString()}
            </p>
            <p className="benchmark-basis">{row.basis} · {row.sources}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
