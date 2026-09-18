export function EmptyState({ title = 'Nothing to show', text = 'There are no records that match this view.' }) { return <div className="empty-state"><span>◌</span><h3>{title}</h3><p>{text}</p></div> }
export function StatusBadge({ children }) { const value = String(children).toLowerCase().replaceAll(' ', '-'); return <span className={`status ${value}`}>{children}</span> }
export function LoadingState() { return <div className="loading-state"><span></span>Loading workspace…</div> }
export const formatDate = (date, withTime = false) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }).format(new Date(date))
