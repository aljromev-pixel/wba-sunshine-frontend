import { useRef, useState } from 'react'

export function EmptyState({ title = 'Nothing to show', text = 'There are no records that match this view.' }) {
  return (
    <div className="empty-state">
      <span>◌</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
export function StatusBadge({ children }) {
  const value = String(children).toLowerCase().replaceAll(' ', '-')
  return <span className={`status ${value}`}>{children}</span>
}
export function LoadingState() {
  return (
    <div className="loading-state">
      <span></span>Loading workspace…
    </div>
  )
}
export function FormError({ children }) {
  if (!children) return null
  return <p className="form-error" role="alert">{children}</p>
}
export function AsyncButton({ loading, children, loadingLabel = 'Saving…', ...props }) {
  return <button {...props} disabled={loading || props.disabled}>{loading ? loadingLabel : children}</button>
}
export function ConfirmDialog({ title = 'Confirm action', message, confirmLabel = 'Confirm', onCancel, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const confirm = async () => {
    if (pending.current) return
    pending.current = true
    setLoading(true)
    setError('')
    try {
      await onConfirm()
      onCancel()
    } catch (exception) {
      setError(exception.message || 'Unable to complete this action. Please try again.')
    } finally {
      pending.current = false
      setLoading(false)
    }
  }
  return <div className="confirm-overlay" role="presentation">
    <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <FormError>{error}</FormError>
      <div className="form-actions">
        <button type="button" className="inline-button" onClick={onCancel} disabled={loading}>Cancel</button>
        <AsyncButton type="button" className="button primary" onClick={confirm} loading={loading} loadingLabel="Processing…">{confirmLabel}</AsyncButton>
      </div>
    </section>
  </div>
}
export const formatDate = (date, withTime = false) =>
  new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }).format(
    new Date(date)
  )
