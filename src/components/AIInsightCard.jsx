import { useState, useEffect } from 'react'
import {
  Sparkles, RefreshCw, KeyRound, AlertTriangle,
  Send, MessageSquare, BarChart2,
} from 'lucide-react'
import { useData } from '../context/DataContext'

// ── Error message maps ────────────────────────────────────────────
const TOKEN_ERRORS = {
  'no-key':      'No token set. Click "AI Key" to add your GitHub personal access token.',
  'invalid-key': 'Invalid token. Check it starts with ghp_ or github_pat_ and has not expired.',
  'rate-limit':  'Rate limit reached. Please wait a moment and try again.',
}
const MANUAL_ERRORS = {
  ...TOKEN_ERRORS,
  'empty-prompt': 'Please enter a prompt before generating.',
}

const MANUAL_PLACEHOLDER =
  'Type any question or instruction — the AI will answer it directly.\n\n' +
  'e.g. "What are the top 3 hiring risks based on this market data?"\n' +
  '"Write a one-paragraph pitch to convince the CFO to approve this hire."\n' +
  '"Compare salary ranges across locations and recommend the best hiring market."'

const SUMMARY_PLACEHOLDER =
  'Optional: add a specific angle or focus for the summary.\n\n' +
  'Leave blank for the default executive overview, or add context like:\n' +
  '"Focus on offshore risks for a Series A startup with a tight budget."'

// ── Section key → human label for the subtitle tag list ─────────────────────
const SECTION_LABELS = {
  report:      'Metrics',
  marketsize:  'Market Size',
  capacity:    'Talent Funnel',
  sourcing:    'Sourcing',
  rates:       'Salary',
  insights:    'Insights',
  geo:         'Geography',
}

function buildSubtitle(visibleSections) {
  if (!visibleSections || visibleSections.size === 0) {
    return 'No data sections active'
  }
  const labels = Object.entries(SECTION_LABELS)
    .filter(([key]) => visibleSections.has(key))
    .map(([, label]) => label)
  if (labels.length === 0) return 'No data sections active'
  const count = labels.length
  return `${count} section${count !== 1 ? 's' : ''} · ${labels.join(' · ')}`
}

export default function AIInsightCard({
  // Mode 2 — summary
  summary, loading, error, onRegenerate, onGenerate,
  customInstruction, onInstructionChange,
  // Mode 1 — manual
  manualOutput, manualLoading, manualError, onManualGenerate,
  // Shared
  onOpenKeyModal, mode, onModeChange, hasKey,
  // Active sections (from useAIInsight)
  visibleSections,
}) {
  const { data } = useData()
  const titles = data.widgetTitles || {}
  const [manualDraft,  setManualDraft]  = useState('')
  const [summaryDraft, setSummaryDraft] = useState(customInstruction || '')

  // Keep summaryDraft in sync if customInstruction changes externally (e.g. loaded from localStorage)
  useEffect(() => {
    setSummaryDraft(customInstruction || '')
  }, [customInstruction])

  const isManual  = mode === 'manual'
  const isSummary = mode === 'summary'

  // ── Manual mode handlers ─────────────────────────────────────
  function handleManualGenerate() {
    onManualGenerate(manualDraft)
  }
  function handleManualKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleManualGenerate()
    }
  }

  // ── Summary mode handlers ────────────────────────────────────
  function handleSummaryGenerate() {
    onInstructionChange(summaryDraft)
    onGenerate(summaryDraft)
  }
  function handleSummaryKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSummaryGenerate()
    }
  }

  // ── Friendly errors ──────────────────────────────────────────
  const manualFriendlyError  = manualError  ? (MANUAL_ERRORS[manualError]  || `AI error: ${manualError}`)  : null
  const summaryFriendlyError = error        ? (TOKEN_ERRORS[error]         || `AI error: ${error}`)        : null
  const manualNeedsKey  = manualError  === 'no-key' && !hasKey
  const summaryNeedsKey = error        === 'no-key' && !hasKey

  return (
    <div className="card ai-insight-card">
      {/* ── Card header ─────────────────────────────────────────── */}
      <div className="card-header">
        <div className="ai-card-title-row">
          <span className="ai-spark-icon"><Sparkles size={16} /></span>
          <div>
            <h2 className="card-title">{titles.aiOverview || 'AI Market Overview'}</h2>
            <p className="card-subtitle">{buildSubtitle(visibleSections)}</p>
          </div>
        </div>
        <div className="ai-card-actions no-pdf">
          <button className="ai-btn ai-btn-key" onClick={onOpenKeyModal} title="Configure GitHub token">
            <KeyRound size={13} /> AI Key
          </button>
        </div>
      </div>

      {/* ── Mode tabs ───────────────────────────────────────────── */}
      <div className="ai-mode-tabs no-pdf">
        <button
          className={`ai-mode-tab ${isSummary ? 'active' : ''}`}
          onClick={() => onModeChange('summary')}
          title="Auto-generate an AI summary from your dashboard data"
        >
          <BarChart2 size={13} />
          AI Summary
        </button>
        <button
          className={`ai-mode-tab ${isManual ? 'active' : ''}`}
          onClick={() => onModeChange('manual')}
          title="Ask the AI any question and see the output here"
        >
          <MessageSquare size={13} />
          Manual Prompt
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════
          MODE 1 — MANUAL PROMPT
      ════════════════════════════════════════════════════════════ */}
      {isManual && (
        <div className="ai-mode-panel">
          <div className="ai-prompt-section no-pdf">
            <label className="ai-prompt-label">
              Your prompt
              <span className="ai-prompt-hint">Ctrl+Enter to send</span>
            </label>
            <textarea
              className="ai-prompt-textarea"
              value={manualDraft}
              onChange={(e) => setManualDraft(e.target.value)}
              onKeyDown={handleManualKeyDown}
              placeholder={MANUAL_PLACEHOLDER}
              rows={4}
              spellCheck={false}
            />
            <div className="ai-prompt-actions">
              <button
                className="ai-btn ai-btn-key"
                onClick={handleManualGenerate}
                disabled={manualLoading || !manualDraft.trim()}
                title="Send prompt"
              >
                <Send size={13} />
                {manualLoading ? 'Generating…' : 'Send'}
              </button>
            </div>
          </div>

          {/* Output area */}
          <div className="ai-manual-output">
            {manualLoading && (
              <div className="ai-loading">
                <div className="ai-loading-dots"><span /><span /><span /></div>
                <span className="ai-loading-text">Thinking…</span>
              </div>
            )}

            {!manualLoading && manualFriendlyError && (
              <div className={`ai-error ${manualNeedsKey ? 'ai-error-key' : 'ai-error-warn'}`}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{manualFriendlyError}</span>
                {manualNeedsKey && (
                  <button className="ai-btn ai-btn-key ai-inline-key-btn" onClick={onOpenKeyModal}>
                    <KeyRound size={12} /> Add Token
                  </button>
                )}
              </div>
            )}

            {!manualLoading && !manualError && manualOutput && (
              <div className="ai-manual-result">
                <div className="ai-manual-result-header">
                  <span className="ai-manual-result-label">Response</span>
                  <button
                    className="ai-btn ai-btn-regenerate"
                    onClick={handleManualGenerate}
                    title="Resend prompt"
                    disabled={!manualDraft.trim()}
                  >
                    <RefreshCw size={12} /> Resend
                  </button>
                </div>
                <p className="ai-summary">{manualOutput}</p>
              </div>
            )}

            {!manualLoading && !manualError && !manualOutput && (
              <div className="ai-empty ai-empty--manual">
                <MessageSquare size={20} style={{ opacity: 0.2 }} />
                <p>Type a prompt above and click <strong>Send</strong> to get a response.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODE 2 — AI SUMMARY FROM DATASET
      ════════════════════════════════════════════════════════════ */}
      {isSummary && (
        <div className="ai-mode-panel">
          <div className="ai-prompt-section ai-prompt-section--compact no-pdf">
            <label className="ai-prompt-label">
              Focus / instructions <span className="ai-prompt-optional">(optional)</span>
              <span className="ai-prompt-hint">Ctrl+Enter to generate</span>
            </label>
            <div className="ai-summary-input-row">
              <textarea
                className="ai-prompt-textarea ai-prompt-textarea--inline"
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                onKeyDown={handleSummaryKeyDown}
                placeholder={SUMMARY_PLACEHOLDER}
                rows={2}
                spellCheck={false}
              />
              <button
                className="ai-btn ai-btn-key ai-summary-generate-btn"
                onClick={handleSummaryGenerate}
                disabled={loading}
                title="Generate AI summary from dashboard data"
              >
                <Sparkles size={13} />
                {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="ai-body">
            {loading && (
              <div className="ai-loading">
                <div className="ai-loading-dots"><span /><span /><span /></div>
                <span className="ai-loading-text">Analysing market data with GitHub Models…</span>
              </div>
            )}

            {!loading && summaryFriendlyError && (
              <div className={`ai-error ${summaryNeedsKey ? 'ai-error-key' : 'ai-error-warn'}`}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{summaryFriendlyError}</span>
                {summaryNeedsKey && (
                  <button className="ai-btn ai-btn-key ai-inline-key-btn" onClick={onOpenKeyModal}>
                    <KeyRound size={12} /> Add Token
                  </button>
                )}
              </div>
            )}

            {!loading && !error && summary && (
              <>
                <p className="ai-summary">{summary}</p>
                <div className="ai-summary-footer no-pdf">
                  <button className="ai-btn ai-btn-regenerate" onClick={handleSummaryGenerate} title="Regenerate">
                    <RefreshCw size={12} /> Regenerate
                  </button>
                  {customInstruction && (
                    <span className="ai-summary-focus-tag">
                      Focus: <em>{customInstruction}</em>
                    </span>
                  )}
                </div>
              </>
            )}

            {!loading && !error && !summary && (
              hasKey ? (
                <div className="ai-loading">
                  <div className="ai-loading-dots"><span /><span /><span /></div>
                  <span className="ai-loading-text">Analysing market data with GitHub Models…</span>
                </div>
              ) : (
              <div className="ai-empty">
                <Sparkles size={22} style={{ opacity: 0.25 }} />
                <p>
                  Add your <strong>GitHub personal access token</strong> then click <strong>Generate</strong> to get 7 AI-generated key points covering market supply and hiring predictions.
                </p>
                <button className="ai-btn ai-btn-key" onClick={onOpenKeyModal}>
                  <KeyRound size={13} /> Add Token — it's free
                </button>
              </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
