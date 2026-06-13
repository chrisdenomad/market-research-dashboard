// ═══════════════════════════════════════════════════════════════════════
//  DASHBOARD DATA — Edit this file to update the dashboard with your
//  real research data. Each section is clearly labelled.
// ═══════════════════════════════════════════════════════════════════════

// ─── WIDGET TITLES ─────────────────────────────────────────────────────
export const widgetTitles = {
  aiOverview:           'AI Market Overview',
  marketSize:           'Market Size by Location',
  marketCapacity:       'Market Capacity',
  geoDistribution:      'Geographic Distribution',
  sourcing:             'Sourcing Outlook',
  keyInsights:          'Key Insights',
  benchmark:            'Market Rate Benchmark',
  methodology:          'Search Methodology',
}

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

// ─── GEOGRAPHIC DISTRIBUTION ────────────────────────────────────────────
// Regions with capacity supply data, map coordinates (SVG viewport 0-1000 x 0-600),
// and year-over-year change percentages.
export const geoRegions = [
  {
    id: 'sg',
    name: 'Singapore',
    country: 'Singapore',
    countryCode: '702',   // ISO 3166-1 numeric — matches TopoJSON feature id
    zone: 'Southeast Asia',
    supply: 119,
    available: 62,
    lat: 1.3521,
    lng: 103.8198,
    color: '#6366f1',
    yoyChange: 12,
    marketShare: 38.3,
  },
  {
    id: 'syd',
    name: 'Sydney',
    country: 'Australia',
    countryCode: '036',
    zone: 'Oceania',
    supply: 104,
    available: 40,
    lat: -33.8688,
    lng: 151.2093,
    color: '#8b5cf6',
    yoyChange: -3,
    marketShare: 33.4,
  },
  {
    id: 'hk',
    name: 'Hong Kong',
    country: 'Hong Kong SAR',
    countryCode: '344',
    zone: 'East Asia',
    supply: 87,
    available: 31,
    lat: 22.3193,
    lng: 114.1694,
    color: '#a78bfa',
    yoyChange: 7,
    marketShare: 28.0,
  },
  {
    id: 'kl',
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    countryCode: '458',
    zone: 'Southeast Asia',
    supply: 54,
    available: 22,
    lat: 3.1390,
    lng: 101.6869,
    color: '#c4b5fd',
    yoyChange: 18,
    marketShare: 17.4,
  },
  {
    id: 'jp',
    name: 'Tokyo',
    country: 'Japan',
    countryCode: '392',
    zone: 'East Asia',
    supply: 78,
    available: 28,
    lat: 35.6762,
    lng: 139.6503,
    color: '#7c3aed',
    yoyChange: 5,
    marketShare: 25.1,
  },
  {
    id: 'in',
    name: 'Bangalore',
    country: 'India',
    countryCode: '356',
    zone: 'South Asia',
    supply: 142,
    available: 71,
    lat: 12.9716,
    lng: 77.5946,
    color: '#4f46e5',
    yoyChange: 22,
    marketShare: 45.6,
  },
  {
    id: 'ph',
    name: 'Manila',
    country: 'Philippines',
    countryCode: '608',
    zone: 'Southeast Asia',
    supply: 46,
    available: 19,
    lat: 14.5995,
    lng: 120.9842,
    color: '#818cf8',
    yoyChange: 9,
    marketShare: 14.8,
  },
  {
    id: 'nz',
    name: 'Auckland',
    country: 'New Zealand',
    countryCode: '554',
    zone: 'Oceania',
    supply: 31,
    available: 14,
    lat: -36.8485,
    lng: 174.7633,
    color: '#6d28d9',
    yoyChange: -1,
    marketShare: 10.0,
  },
]

// ─── COUNTRY BOUNDS (lng/lat bounding boxes for auto-zoom) ───────────────
// Used to fit the map viewport when a country filter is active.
export const countryBounds = {
  'Singapore':     { minLng: 103.6,  maxLng: 104.0,  minLat: 1.15,   maxLat: 1.50  },
  'Australia':     { minLng: 113.0,  maxLng: 154.0,  minLat: -39.0,  maxLat: -10.0 },
  'Hong Kong SAR': { minLng: 113.8,  maxLng: 114.5,  minLat: 22.1,   maxLat: 22.6  },
  'Malaysia':      { minLng: 99.6,   maxLng: 119.3,  minLat: 0.8,    maxLat: 7.4   },
  'Japan':         { minLng: 129.5,  maxLng: 145.8,  minLat: 31.0,   maxLat: 45.5  },
  'India':         { minLng: 68.0,   maxLng: 97.4,   minLat: 8.0,    maxLat: 37.1  },
  'Philippines':   { minLng: 116.9,  maxLng: 126.6,  minLat: 4.6,    maxLat: 20.9  },
  'New Zealand':   { minLng: 166.4,  maxLng: 178.6,  minLat: -47.3,  maxLat: -34.4 },
}

// ─── SUPPLY TREND DATA (monthly over 12 months) ─────────────────────────
// Each region has monthly supply figures for trend line charts.
export const geoTrendData = [
  { month: 'Jul',  sg: 98,  syd: 110, hk: 79,  kl: 42, jp: 71,  in: 108, ph: 40, nz: 30 },
  { month: 'Aug',  sg: 102, syd: 108, hk: 81,  kl: 44, jp: 72,  in: 114, ph: 41, nz: 29 },
  { month: 'Sep',  sg: 105, syd: 106, hk: 80,  kl: 45, jp: 73,  in: 118, ph: 42, nz: 30 },
  { month: 'Oct',  sg: 108, syd: 105, hk: 83,  kl: 47, jp: 74,  in: 122, ph: 43, nz: 30 },
  { month: 'Nov',  sg: 110, syd: 107, hk: 82,  kl: 48, jp: 74,  in: 126, ph: 44, nz: 31 },
  { month: 'Dec',  sg: 109, syd: 104, hk: 84,  kl: 49, jp: 75,  in: 128, ph: 43, nz: 30 },
  { month: 'Jan',  sg: 112, syd: 102, hk: 83,  kl: 50, jp: 76,  in: 130, ph: 44, nz: 31 },
  { month: 'Feb',  sg: 113, syd: 101, hk: 85,  kl: 51, jp: 76,  in: 133, ph: 44, nz: 31 },
  { month: 'Mar',  sg: 115, syd: 103, hk: 86,  kl: 52, jp: 77,  in: 136, ph: 45, nz: 31 },
  { month: 'Apr',  sg: 116, syd: 103, hk: 86,  kl: 53, jp: 77,  in: 138, ph: 45, nz: 31 },
  { month: 'May',  sg: 118, syd: 105, hk: 87,  kl: 54, jp: 78,  in: 141, ph: 46, nz: 31 },
  { month: 'Jun',  sg: 119, syd: 104, hk: 87,  kl: 54, jp: 78,  in: 142, ph: 46, nz: 31 },
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
