// ═══════════════════════════════════════════════════════════════════════
//  DASHBOARD DATA — Edit this file to update the dashboard with your
//  real research data. Each section is clearly labelled.
// ═══════════════════════════════════════════════════════════════════════

// ─── REPORT METADATA ───────────────────────────────────────────────────
export const reportMeta = {
  title: 'Talent Market Research',        // ← Dashboard heading
  role: 'Security Specialist',            // ← Role being researched
  date: 'June 2026',                      // ← Report date
  preparedBy: 'Tri Le',                   // ← Your name
  company: 'EPAM Systems',               // ← Company / client
}

// ─── KPI SUMMARY CARDS (top 4 cards) ──────────────────────────────────
export const kpiData = [
  {
    label: 'Total Identified',
    value: '223',
    unit: 'profiles',
    change: '+12% vs last quarter',
    trend: 'up',
    icon: 'users',
  },
  {
    label: 'Available Candidates',
    value: '102',
    unit: 'candidates',
    change: '45.7% availability rate',
    trend: 'up',
    icon: 'userCheck',
  },
  {
    label: 'Markets Covered',
    value: '3',
    unit: 'cities',
    change: 'SG · SYD · HKG',
    trend: 'neutral',
    icon: 'mapPin',
  },
  {
    label: 'Avg. Time to Fill',
    value: '1.5–2',
    unit: 'months',
    change: 'Based on historic data',
    trend: 'neutral',
    icon: 'clock',
  },
]

// ─── MARKET SIZE BY LOCATION ────────────────────────────────────────────
// Add or remove cities as needed. 'size' = total profiles, 'available' = open to opportunities
export const marketSizeData = [
  { city: 'Singapore', size: 119, available: 62 },
  { city: 'Sydney',    size: 104, available: 40 },
  { city: 'Hong Kong', size: 87,  available: 31 },  // ← placeholder — replace with real data
]

// ─── MARKET CAPACITY (Talent Funnel: TAM → SAM → SOM) ──────────────────
export const marketCapacityData = [
  {
    label: 'TAM',
    fullLabel: 'Total Addressable Market',
    value: 310,
    description: 'All Security Specialist profiles across target regions (visible on LinkedIn)',
    color: '#6366f1',
  },
  {
    label: 'SAM',
    fullLabel: 'Serviceable Addressable Market',
    value: 223,
    description: 'Profiles matching defined search criteria (role, experience, location)',
    color: '#8b5cf6',
  },
  {
    label: 'SOM',
    fullLabel: 'Serviceable Obtainable Market',
    value: 102,
    description: 'Candidates identified as potentially open to opportunities',
    color: '#a78bfa',
  },
  {
    label: 'Target',
    fullLabel: 'Estimated Reachable in 1–3 months',
    value: 35,
    description: 'Projected reachable candidates given outreach capacity and conversion rates',
    color: '#c4b5fd',
  },
]

// ─── SOURCING OUTLOOK (Conversion Funnel) ──────────────────────────────
export const sourcingFunnelData = [
  {
    stage: 'Total Profiles Identified',
    count: 223,
    pct: 100,
    color: '#6366f1',
    note: 'Matched defined search criteria on LinkedIn',
  },
  {
    stage: 'Outreach Required',
    count: 150,
    pct: 67,
    color: '#8b5cf6',
    note: '120–150+ outreaches typically needed per placement',
  },
  {
    stage: 'Expected Replies',
    count: 60,
    pct: 40,
    color: '#a78bfa',
    note: 'Reply rate: 30–50% (some roles may require 400+ outreaches)',
  },
  {
    stage: 'Screened & Qualified',
    count: 15,
    pct: 25,
    color: '#c4b5fd',
    note: 'Candidates passing initial screening against role requirements',
  },
  {
    stage: 'Offers / Placements',
    count: 3,
    pct: 2,
    color: '#ddd6fe',
    note: 'Conversion rate < 1% — expect 1–3 headcounts filled in 1–3 months',
  },
]

export const sourcingStats = [
  { label: 'Reply Rate',       value: '30–50%',    note: 'Varies by role complexity' },
  { label: 'Conversion Rate',  value: '< 1%',      note: 'Offers per total outreach' },
  { label: 'Outreach / Hire',  value: '120–150+',  note: 'Up to 400+ for niche roles' },
  { label: 'Time to Fill',     value: '1–4 months',note: 'Mean: 1.5–2 months per headcount' },
  { label: 'Expected Fills',   value: '1–3',       note: 'Within 1–3 month timeframe' },
]

// ─── MARKET RATE BENCHMARK ──────────────────────────────────────────────
export const salaryBenchmarkData = [
  {
    location: 'Singapore',
    rangeMin: 2800,
    rangeMax: 3500,
    currency: 'SGD',
    basis: 'Monthly',
    sources: 'JobStreet, Seek, Indeed',
  },
  {
    location: 'Sydney',
    rangeMin: 65000,
    rangeMax: 78000,
    currency: 'AUD',
    basis: 'Yearly',
    sources: 'JobStreet, Seek, Indeed',
  },
  {
    location: 'Hong Kong',   // ← placeholder — replace with real data
    rangeMin: 18000,
    rangeMax: 24000,
    currency: 'HKD',
    basis: 'Monthly',
    sources: 'JobsDB, LinkedIn Jobs',
  },
]

// ─── KEY INSIGHTS ───────────────────────────────────────────────────────
// Tags: 'Opportunity' | 'Risk' | 'Trend' | 'Watch' | 'Note'
export const keyInsightsData = [
  {
    tag: 'Opportunity',
    title: 'Singapore Offers Stronger Hiring Conditions',
    body: 'With 119 profiles and 62 available candidates, Singapore provides more candidate choice and is likely to yield faster placements compared to Sydney.',
  },
  {
    tag: 'Watch',
    title: 'Sydney Talent Market Is Tighter',
    body: 'Sydney shows lower candidate availability (40 out of 104 profiles). A longer search timeline should be anticipated, along with a broader sourcing strategy.',
  },
  {
    tag: 'Risk',
    title: 'SOC / Tech Experience Is a Smaller Segment',
    body: 'Candidates with direct experience in large-scale Security Operations Centers, tech companies, or complex corporate security environments represent a smaller portion of the market and may require targeted sourcing.',
  },
  {
    tag: 'Risk',
    title: 'Variable Depth of Security Expertise',
    body: 'Candidate backgrounds vary — some profiles are weighted more toward operations, facilities, or client service rather than core security functions. Depth of expertise must be assessed carefully.',
  },
  {
    tag: 'Trend',
    title: 'Non-Corporate Security Backgrounds Are Common',
    body: 'Many candidates come from law enforcement, firefighting, or military backgrounds. While security-focused, they may lack corporate environment exposure and require additional evaluation.',
  },
  {
    tag: 'Note',
    title: 'Plan for High Outreach Volume',
    body: 'Conversion rates are below 1%. Plan for 120–150+ outreaches per placement, with some roles requiring 400+ contacts. Set realistic timelines of 1–3 months to fill 1–3 headcounts.',
  },
]

// ─── SEARCH METHODOLOGY ─────────────────────────────────────────────────
export const methodologyData = {
  criteria: [
    { label: 'Role',                value: 'Security Champion (physical security)' },
    { label: 'Search Platform',     value: 'LinkedIn (visible profiles only)' },
    { label: 'Location',            value: 'Sydney & Singapore' },
    { label: 'Excluded Company',    value: 'EPAM' },
    { label: 'Experience Required', value: '5+ years (equivalent A2/A3 EPAM standard)' },
  ],
  sources: [
    { name: 'LinkedIn Profile Search', confidence: 85, sampleSize: 223,  note: 'Primary source — visible profiles only' },
    { name: 'Hiring Platforms (JobStreet, Seek, Indeed)', confidence: 75, sampleSize: 180, note: 'Salary benchmark data' },
    { name: 'Historic Recruiter Data', confidence: 90, sampleSize: null,  note: 'Conversion rates and time-to-fill estimates' },
    { name: 'Expert / Researcher Assessment', confidence: 70, sampleSize: null, note: 'Qualitative evaluation of candidate backgrounds' },
  ],
  disclaimers: [
    'This dataset is based solely on LinkedIn profiles that matched the defined search criteria.',
    'Results may include candidates from NHA companies and restricted countries, consistent with EPAM external market intelligence practices.',
    'Figures represent market estimates, not exact headcounts or hiring guarantees.',
    'Given that the process and nature of work for this role differ significantly from previous IT positions, sourcing timeline analysis should be considered for reference purposes only.',
  ],
}
