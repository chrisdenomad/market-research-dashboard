import { useState } from 'react'
import { X, KeyRound, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react'

// GitHub PATs: classic start with "ghp_", fine-grained start with "github_pat_"
function isValidToken(t) {
  const v = t.trim()
  return (v.startsWith('ghp_') || v.startsWith('github_pat_')) && v.length > 20
}

export default function APIKeyModal({ currentKey, onSave, onClose }) {
  const [key,     setKey]     = useState(currentKey || '')
  const [visible, setVisible] = useState(false)
  const [saved,   setSaved]   = useState(false)

  const hasExistingKey = !!currentKey

  function handleSave() {
    onSave(key.trim())
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 800)
  }

  function handleClear() {
    setKey('')
    onSave('')
  }

  const valid = isValidToken(key)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: 500 }}>

        <div className="modal-header">
          <div className="modal-header-left">
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={18} /> GitHub Personal Access Token
            </h2>
            <p className="modal-subtitle">
              Your token is stored only in your browser. Never shared with anyone.
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>

          <div className="api-key-info-box">
            {hasExistingKey && (
              <p className="api-key-saved-status">
                <ShieldCheck size={14} /> Token already saved in your browser — AI will auto-load on every visit.
              </p>
            )}
            <p className="api-key-info-title">How to get a GitHub token for AI Models</p>
            <ol className="api-key-steps">
              <li>Go to <strong>github.com/settings/tokens</strong> and sign in</li>
              <li>Click <strong>Generate new token (classic)</strong></li>
              <li>Give it a name, set expiration, no scopes needed for Models</li>
              <li>Copy the token (starts with <code>ghp_</code>) and paste below</li>
            </ol>
            <p className="api-key-cost">
              Free tier: GitHub Models are free while in beta · No credit card required
            </p>
          </div>

          <div className="form-row" style={{ marginTop: 20 }}>
            <label className="form-label">Your GitHub Personal Access Token</label>
            <div className="api-key-input-wrap">
              <input
                className="form-input api-key-input"
                type={visible ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="ghp_... or github_pat_..."
                spellCheck={false}
                autoComplete="off"
              />
              <button
                className="api-key-toggle"
                onClick={() => setVisible((v) => !v)}
                title={visible ? 'Hide token' : 'Show token'}
                type="button"
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {key && !valid && (
              <p className="api-key-hint">Token should start with <code>ghp_</code> or <code>github_pat_</code></p>
            )}
            {key && valid && (
              <p className="api-key-hint api-key-hint-ok">Token format looks valid</p>
            )}
          </div>

        </div>

        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-danger"
            onClick={handleClear}
            disabled={!key}
          >
            Clear Token
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-apply"
              onClick={handleSave}
              disabled={!valid || saved}
            >
              {saved
                ? <><Check size={14} /> Saved</>
                : <><KeyRound size={14} /> Save Token</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
