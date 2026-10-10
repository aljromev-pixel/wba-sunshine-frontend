import { useEffect, useMemo, useState } from 'react'
import { AsyncButton, ConfirmDialog, EmptyState, FormError, StatusBadge, formatDate } from '../components/Shared'
import { useApp } from '../context/AppContext'
import { userService } from '../services/userService'
import { apiErrorMessage } from '../utils/apiErrors'
import { calculateReorder } from '../utils/inventoryLogic'

export function Alerts() {
  const { data } = useApp()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All alerts')
  const alerts = data.alerts ? [] : []
  const rows = useMemo(() => {
    const list = [...new Set([])]
    return list
  }, [])
  const generated = (() => {
    const low = data.products
      .filter((p) => p.stock <= p.reorderPoint)
      .map((p) => ({
        id: `low-${p.id}`,
        type: 'Low Stock',
        product: p.name,
        detail: `${p.stock} available; reorder point ${p.reorderPoint}`,
        severity: 'High',
        date: new Date().toISOString(),
      }))
    const exp = data.batches
      .filter((b) => b.expiresAt && b.quantity && (b.expiresAt < '2026-09-19' || b.expiresAt <= '2026-10-19'))
      .map((b) => ({
        id: b.id,
        type: b.expiresAt < '2026-09-19' ? 'Expired Stock' : 'Expiring Stock',
        product: data.products.find((p) => p.id === b.productId)?.name,
        detail: `${b.number} expires ${b.expiresAt}`,
        severity: b.expiresAt < '2026-09-19' ? 'High' : 'Medium',
        date: b.expiresAt,
      }))
    const dis = data.adjustments
      .filter((a) => a.status === 'Pending')
      .map((a) => ({
        id: a.id,
        type: 'Inventory Discrepancy',
        product: data.products.find((p) => p.id === a.productId)?.name,
        detail: `${a.id}: system ${a.systemQty}, counted ${a.requestedQty}`,
        severity: 'High',
        date: a.date,
      }))
    return [...low, ...exp, ...dis]
  })().filter(
    (a) =>
      (type === 'All alerts' || a.type === type) &&
      `${a.product} ${a.detail}`.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">IN-APP MONITORING</p>
          <h2>Inventory alerts</h2>
          <p>Review low stock, expiry, capacity, and discrepancy signals without external notifications.</p>
        </div>
        <span className="record-count">{generated.length} active alerts</span>
      </div>
      <section className="surface">
        <div className="filter-bar">
          <label className="search-field">
            <span>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts" />
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>All alerts</option>
            <option>Low Stock</option>
            <option>Expiring Stock</option>
            <option>Expired Stock</option>
            <option>Inventory Discrepancy</option>
          </select>
        </div>
        <div className="alert-list">
          {generated.map((a) => (
            <article key={a.id}>
              <StatusBadge>{a.severity}</StatusBadge>
              <div>
                <strong>
                  {a.type} · {a.product}
                </strong>
                <p>{a.detail}</p>
                <small>Generated {formatDate(a.date)}</small>
              </div>
              <a
                href={
                  a.type === 'Inventory Discrepancy'
                    ? '#/adjustments'
                    : a.type.includes('Stock')
                      ? '#/inventory'
                      : '#/batches'
                }
              >
                Review →
              </a>
            </article>
          ))}
          {!generated.length && (
            <EmptyState title="No alerts match this view" text="Your selected inventory signals are clear." />
          )}
        </div>
      </section>
    </section>
  )
}
export function ReorderCalculator() {
  const { data } = useApp()
  const [productId, setProductId] = useState('ac-15')
  const [month, setMonth] = useState('June')
  const [monthly, setMonthly] = useState('58')
  const [lead, setLead] = useState('7')
  const [safety, setSafety] = useState('15')
  const multipliers = { June: 3, July: 2.5, December: 0.3, Stable: 1 }
  const result = calculateReorder({
    monthlySales: monthly,
    leadTime: lead,
    safetyPercent: safety,
    multiplier: multipliers[month],
  })
  const choose = (id) => {
    const p = data.products.find((x) => x.id === id)
    setProductId(id)
    setMonthly(String(p.monthlySales))
    setLead(String(p.leadTime))
    setSafety('15')
  }
  const p = data.products.find((x) => x.id === productId)
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">PURCHASING PLANNING</p>
          <h2>Seasonal reorder calculator</h2>
          <p>Formula-based purchasing support using sales baseline, lead time, seasonal demand, and safety stock.</p>
        </div>
      </div>
      <div className="two-column calculator-grid">
        <section className="surface compact-form">
          <label>
            Product
            <select value={productId} onChange={(e) => choose(e.target.value)}>
              {data.products.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Average monthly sales
            <input type="number" min="0" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </label>
          <label>
            Lead time
            <select value={lead} onChange={(e) => setLead(e.target.value)}>
              <option value="7">Local supplier — 7 days</option>
              <option value="21">Imported supplier — 21 days</option>
              <option value="14">Custom — 14 days</option>
            </select>
          </label>
          <label>
            Season
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {Object.entries(multipliers).map(([k, v]) => (
                <option key={k}>
                  {k} — {v}x
                </option>
              ))}
            </select>
          </label>
          <label>
            Safety stock %
            <select value={safety} onChange={(e) => setSafety(e.target.value)}>
              <option value="15">Seasonal-critical — 15%</option>
              <option value="10">Stable — 10%</option>
            </select>
          </label>
        </section>
        <section className="surface formula-card">
          <p className="eyebrow">CALCULATED RECOMMENDATION</p>
          <h2>{p?.name}</h2>
          <div className="formula-results">
            <div>
              <small>Predicted daily demand</small>
              <strong>{result.dailyDemand.toFixed(1)}</strong>
              <span>monthly sales ÷ 30</span>
            </div>
            <div>
              <small>Safety stock</small>
              <strong>{Math.ceil(result.safetyStock)}</strong>
              <span>daily demand × lead time × {safety}%</span>
            </div>
            <div className="reorder-result">
              <small>Reorder point</small>
              <strong>{Math.ceil(result.reorderPoint)}</strong>
              <span>at {multipliers[month]}x seasonal multiplier</span>
            </div>
          </div>
          <p className="formula-note">ROP = (daily demand × seasonal multiplier × lead time) + safety stock</p>
        </section>
      </div>
    </section>
  )
}
const reportTypes = [
  'Inventory Summary',
  'Stock Movement Report',
  'Low Stock Report',
  'Expiring Stock Report',
  'Inventory Discrepancy Report',
  'Cycle Count Report',
  'Adjustment Report',
  'Seasonal Reorder Report',
]
export function Reports() {
  const { data } = useApp()
  const [report, setReport] = useState(reportTypes[0])
  const rows =
    report === 'Stock Movement Report'
      ? data.transactions
      : report === 'Adjustment Report' || report === 'Cycle Count Report'
        ? data.adjustments
        : report === 'Low Stock Report'
          ? data.products.filter((p) => p.stock <= p.reorderPoint)
          : report === 'Expiring Stock Report'
            ? data.batches.filter((b) => b.expiresAt)
            : data.products
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">MANAGEMENT REPORTING</p>
          <h2>Inventory reports</h2>
          <p>Mock report views designed to be backed by Laravel report endpoints later.</p>
        </div>
      </div>
      <section className="surface">
        <div className="filter-bar">
          <select value={report} onChange={(e) => setReport(e.target.value)}>
            {reportTypes.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button className="button primary" onClick={() => window.print()}>
            Print report
          </button>
        </div>
        <h3 className="report-title">{report}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Description</th>
                <th>Quantity / value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const p = data.products.find((x) => x.id === (r.productId || r.id))
                return (
                  <tr key={r.id || i}>
                    <td>
                      <strong>{r.id || r.sku}</strong>
                    </td>
                    <td>{r.name || p?.name || r.type || 'Inventory record'}</td>
                    <td>{r.quantity ?? r.stock ?? r.requestedQty ?? '—'}</td>
                    <td>
                      <StatusBadge>{r.status || 'Active'}</StatusBadge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!rows.length && <EmptyState title="No data for this report" />}
        </div>
      </section>
    </section>
  )
}
export function AuditTrail() {
  const { data } = useApp()
  const [search, setSearch] = useState('')
  const rows = data.audit.filter((a) =>
    `${a.user} ${a.action} ${a.reference} ${a.description}`.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">ACCOUNTABILITY</p>
          <h2>Audit trail</h2>
          <p>Every important inventory workflow action is traceable by user, department, and role level.</p>
        </div>
      </div>
      <section className="surface">
        <div className="filter-bar">
          <label className="search-field">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, reference, or action"
            />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / access</th>
                <th>Action</th>
                <th>Module</th>
                <th>Reference</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.timestamp, true)}</td>
                  <td>
                    <strong>{a.user}</strong>
                    <small>
                      {a.department} • {a.roleLevel}
                    </small>
                  </td>
                  <td>{a.action}</td>
                  <td>{a.module}</td>
                  <td>{a.reference}</td>
                  <td>{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState title="No audit records found" />}
        </div>
      </section>
    </section>
  )
}
export function Users() {
  const { notify } = useApp()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const load = async () => {
    setLoading(true)
    setLoadError('')
    try { setUsers(await userService.list()) } catch (exception) { setLoadError(apiErrorMessage(exception)) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const save = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (form.id) await userService.update(form.id, payload)
      else await userService.create(payload)
      notify(`User ${form.id ? 'updated' : 'created'}.`)
      setForm(null); setError(''); await load()
    } catch (exception) { setError(apiErrorMessage(exception)) } finally { setSubmitting(false) }
  }
  const remove = async (user) => {
    try { await userService.remove(user.id); notify('User deleted.'); await load() } catch (exception) { notify(apiErrorMessage(exception), 'error') }
  }
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h2>User management</h2>
          <p>Create, edit, and remove persistent accounts with Department + Role Level assignment.</p>
        </div>
        <button className="button primary" onClick={() => setForm({ name: '', email: '', password: '', department: 'Warehouse', roleLevel: 'Staff' })}>Add user</button>
      </div>
      {form && <form className="surface compact-form" onSubmit={save}><div className="section-heading"><div><p className="eyebrow">{form.id ? 'EDIT' : 'CREATE'}</p><h2>{form.id ? 'Edit user' : 'Add user'}</h2></div><button type="button" className="inline-button" onClick={() => { setForm(null); setError('') }} disabled={submitting}>Cancel</button></div><div className="form-grid"><label>Name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required disabled={submitting} /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required disabled={submitting} /></label><label>Password {form.id && '(leave blank to keep)'}<input type="password" minLength="8" value={form.password || ''} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required={!form.id} disabled={submitting} /></label><label>Department<select value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} disabled={submitting}>{['Warehouse', 'Sales', 'Purchasing', 'Administration'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Role level<select value={form.roleLevel} onChange={(event) => setForm((current) => ({ ...current, roleLevel: event.target.value }))} disabled={submitting}>{['Staff', 'Supervisor', 'Manager'].map((value) => <option key={value}>{value}</option>)}</select></label></div><FormError>{error}</FormError><AsyncButton className="button primary" loading={submitting} loadingLabel="Saving…">{form.id ? 'Save user' : 'Create user'}</AsyncButton></form>}
      <section className="surface">
        {loading && <p role="status">Loading users…</p>}
        <FormError>{loadError}</FormError>
        {loadError && <AsyncButton type="button" className="button primary" loading={loading} loadingLabel="Retrying…" onClick={load}>Retry loading users</AsyncButton>}
        <div className="table-wrap" aria-busy={loading}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Department</th>
                <th>Role level</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.department}</td>
                  <td>{u.roleLevel}</td>
                  <td>
                    <button className="inline-button" onClick={() => setForm({ ...u, password: '' })}>Edit</button>
                    <button className="inline-button" onClick={() => setConfirmation(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !loadError && !users.length && <EmptyState title="No users found" />}
        </div>
      </section>
      {confirmation && <ConfirmDialog title="Delete user?" message={`Delete ${confirmation.name}? This cannot be undone.`} confirmLabel="Delete user" onCancel={() => setConfirmation(null)} onConfirm={() => remove(confirmation)} />}
    </section>
  )
}
