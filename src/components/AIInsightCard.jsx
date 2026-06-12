import { Sparkles, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react'

const ERROR_MESSAGES = {
  'no-key':      'No API key set. Click "AI Key" in the header to add your free Gemini API key.',
  'invalid-key': 'Invalid API key. Please check your key — it should start with AIza.',
  'rate-limit':  'Gemini rate limit reached. Please wait a moment and try again.',
}

export default function AIInsightCard({ summary, loading, error, onRegenerate, onOpenKeyModal }) {
  const friendlyError = error ? (ERROR_MESSAGES[error] || `Gemini error: ${error}`) : null
  const needsKey = error === 'no-key'

  return (
    <div className="card ai-insight-card" id="ai-overview">
      <div className="card-header">
        <div className="ai-card-title-row">
          <span className="ai-spark-icon">
            <Sparkles size={16} />
          </span>
          <div>
            <h2 className="card-title">AI Market Overview</h2>
            <p className="card-subtitle">
              Gemini Flash analysis based on your research data
            </p>
          </div>
        </div>
        <div className="ai-card-actions">
          {!loading && (summary || error) && (
            <button
              className="ai-btn ai-btn-regenerate"
              onClick={onRegenerate}
              title="Regenerate summary"
            >
              <RefreshCw size={13} />
              Regenerate
            </button>
          )}
          <button
            className="ai-btn ai-btn-key"
            onClick={onOpenKeyModal}
            title="Configure Gemini API key"
          >
            <KeyRound size={13} />
            AI Key
          </button>
        </div>
      </div>

      <div className="ai-body">

        {/* Loading state */}
        {loading && (
          <div className="ai-loading">
            <div className="ai-loading-dots">
              <span /><span /><span />
            </div>
            <span className="ai-loading-text">
              Analysing market data with Gemini Flash…
            </span>
          </div>
        )}

        {/* Error state */}
        {!loading && friendlyError && (
          <div className={`ai-error ${needsKey ? 'ai-error-key' : 'ai-error-warn'}`}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{friendlyError}</span>
            {needsKey && (
              <button
                className="ai-btn ai-btn-key ai-inline-key-btn"
                onClick={onOpenKeyModal}
              >
                <KeyRound size={12} /> Add API Key
              </button>
            )}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && summary && (
          <p className="ai-summary">{summary}</p>
        )}

        {/* Empty — no key, no error yet */}
        {!loading && !error && !summary && (
          <div className="ai-empty">
            <Sparkles size={22} style={{ opacity: 0.25 }} />
            <p>
              Add your free <strong>Google Gemini API key</strong> to generate an
              AI-powered executive overview of this market research.
            </p>
            <button className="ai-btn ai-btn-key" onClick={onOpenKeyModal}>
              <KeyRound size={13} /> Add API Key — it's free
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
