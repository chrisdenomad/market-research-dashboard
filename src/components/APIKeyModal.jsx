import { useState } from 'react'
import { X, KeyRound, Eye, EyeOff, Check } from 'lucide-react'

export default function APIKeyModal({ currentKey, onSave, onClose }) {
  const [key,     setKey]     = useState(currentKey || '')
  const [visible, setVisible] = useState(false)
  const [saved,   setSaved]   = useState(false)

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

  // Gemini keys start with "AIza" and are ~39 chars
  const isValid = key.trim().startsWith('AIza') && key.trim().length > 20

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: 500 }}>

        <div className="modal-header">
          <div className="modal-header-left">
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={18} /> Google Gemini API Key
            </h2>
            <p className="modal-subtitle">
              Your key is stored only in your browser and sent directly to Google. Never shared.
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>

          <div className="api-key-info-box">
            <p className="api-key-info-title">How to get a free Gemini API key</p>
            <ol className="api-key-steps">
              <li>Go to <strong>aistudio.google.com</strong> and sign in with Google</li>
              <li>Click <strong>Get API key</strong> in the top left</li>
              <li>Click <strong>Create API key</strong></li>
              <li>Copy the key (starts with <code>AIza…</code>) and paste below</li>
            </ol>
            <p className="api-key-cost">
              Free tier: 1,500 requests/day · 15 requests/min · No credit card required
            </p>
          </div>

          <div className="form-row" style={{ marginTop: 20 }}>
            <label className="form-label">Your Gemini API Key</label>
            <div className="api-key-input-wrap">
              <input
                className="form-input api-key-input"
                type={visible ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza..."
                spellCheck={false}
                autoComplete="off"
              />
              <button
                className="api-key-toggle"
                onClick={() => setVisible((v) => !v)}
                title={visible ? 'Hide key' : 'Show key'}
                type="button"
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {key && !isValid && (
              <p className="api-key-hint">Key should start with <code>AIza</code></p>
            )}
            {key && isValid && (
              <p className="api-key-hint api-key-hint-ok">Key format looks valid</p>
            )}
          </div>

        </div>

        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-danger"
            onClick={handleClear}
            disabled={!key}
          >
            Clear Key
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-apply"
              onClick={handleSave}
              disabled={!isValid || saved}
            >
              {saved
                ? <><Check size={14} /> Saved</>
                : <><KeyRound size={14} /> Save Key</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
