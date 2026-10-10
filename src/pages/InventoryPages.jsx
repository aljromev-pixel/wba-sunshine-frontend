import { useMemo, useState } from 'react'
import { AsyncButton, ConfirmDialog, EmptyState, FormError, StatusBadge, formatDate } from '../components/Shared'
import { useApp } from '../context/AppContext'
import { inventoryService } from '../services/inventoryService'
import { daysUntil, fifoBatch, getBatchStatus, getStockStatus } from '../utils/inventoryLogic'
import { PERMISSIONS } from '../utils/permissions'
import { apiErrorMessage } from '../utils/apiErrors'

const categories = ['All categories', 'Air Conditioners', 'Smart Home', 'Air Quality', 'Replacement Filters']
const emptyProduct = { sku: '', name: '', category: '', stock: 0, reorderPoint: 0, capacity: '', supplier: '', leadTime: 0, unit: 'units', monthlySales: 0 }

function ProductForm({ initial, onClose, onSaved, notify, onBusyChange }) {
  const [form, setForm] = useState(initial ? { ...initial, capacity: initial.capacity ?? '' } : emptyProduct)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    onBusyChange(true)
    try {
      const payload = { ...form, stock: Number(form.stock), reorderPoint: Number(form.reorderPoint), capacity: form.capacity === '' ? null : Number(form.capacity), leadTime: Number(form.leadTime), monthlySales: Number(form.monthlySales) }
      if (initial) await inventoryService.updateProduct(initial.id, payload)
      else await inventoryService.createProduct(payload)
      notify(`Product ${initial ? 'updated' : 'created'}.`)
      onSaved()
    } catch (exception) {
      setError(apiErrorMessage(exception))
    } finally {
      setSubmitting(false)
      onBusyChange(false)
    }
  }
  return <form className="surface compact-form" onSubmit={submit}>
    <div className="section-heading"><div><p className="eyebrow">{initial ? 'EDIT' : 'CREATE'}</p><h2>{initial ? 'Edit product' : 'Add product'}</h2></div><button type="button" className="inline-button" onClick={onClose} disabled={submitting}>Cancel</button></div>
    <div className="form-grid">{[['sku', 'SKU'], ['name', 'Name'], ['category', 'Category'], ['supplier', 'Supplier'], ['unit', 'Unit'], ['stock', 'Starting stock', 'number'], ['reorderPoint', 'Reorder point', 'number'], ['capacity', 'Capacity', 'number'], ['leadTime', 'Lead time (days)', 'number'], ['monthlySales', 'Monthly sales', 'number']].map(([name, label, type = 'text']) => <label key={name}>{label}<input disabled={submitting} name={name} type={type} min={type === 'number' ? '0' : undefined} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={name !== 'capacity' && name !== 'supplier'} /></label>)}</div>
    <FormError>{error}</FormError><AsyncButton className="button primary" loading={submitting} loadingLabel="Saving…">{initial ? 'Save product' : 'Create product'}</AsyncButton>
  </form>
}
export function InventoryList() {
  const { data, can, notify } = useApp()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState('All status')
  const [sort, setSort] = useState('name')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const manage = can(PERMISSIONS.INVENTORY_EDIT)
  const remove = async (item) => {
    try {
      await inventoryService.deleteProduct(item.id)
      notify('Product deleted.')
    } catch (exception) {
      notify(apiErrorMessage(exception), 'error')
    }
  }
  const items = useMemo(
    () =>
      data.products
        .filter(
          (item) =>
            (category === 'All categories' || item.category === category) &&
            (status === 'All status' || getStockStatus(item) === status) &&
            `${item.name} ${item.sku} ${item.supplier}`.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) =>
          sort === 'stock'
            ? a.stock - b.stock
            : sort === 'status'
              ? getStockStatus(a).localeCompare(getStockStatus(b))
              : a.name.localeCompare(b.name)
        ),
    [data.products, search, category, status, sort]
  )
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">PRODUCT CATALOGUE</p>
          <h2>Inventory at a glance</h2>
          <p>Search appliance lines, review supplier details, and open a complete batch history.</p>
        </div>
        <div className="form-actions"><span className="record-count">{items.length} products</span>{manage && <button className="button primary" disabled={saving} onClick={() => { setCreating(true); setEditing(null) }}>Add product</button>}</div>
      </div>
      {(creating || editing) && <ProductForm key={editing?.id || 'new'} onBusyChange={setSaving} initial={editing} notify={notify} onClose={() => { setCreating(false); setEditing(null) }} onSaved={() => { setCreating(false); setEditing(null) }} />}
      <section className="surface">
        <div className="filter-bar">
          <label className="search-field">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search SKU, product, or supplier"
              aria-label="Search products"
            />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter category">
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter stock status">
            <option>All status</option>
            <option>In stock</option>
            <option>Low stock</option>
            <option>Near capacity</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current stock</th>
                <th>Reorder point</th>
                <th>Supplier / lead time</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.sku}</small>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <strong>{item.stock}</strong> {item.unit}
                  </td>
                  <td>
                    {item.reorderPoint} {item.unit}
                  </td>
                  <td>
                    {item.supplier}
                    <small>{item.leadTime} day lead time</small>
                  </td>
                  <td>
                    <StatusBadge>{getStockStatus(item)}</StatusBadge>
                  </td>
                  <td>
                    <a className="row-link" href={`#/inventory/${item.id}`}>
                      Details →
                    </a>
                    {manage && <><button className="inline-button" disabled={saving} onClick={() => { setEditing(item); setCreating(false) }}>Edit</button><button className="inline-button" disabled={saving} onClick={() => setConfirmation(item)}>Delete</button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && (
            <EmptyState title="No products found" text="Try clearing a filter or using a different search term." />
          )}
        </div>
      </section>
      {confirmation && <ConfirmDialog title="Delete product?" message={`Delete ${confirmation.name}? Products with inventory history cannot be deleted.`} confirmLabel="Delete product" onCancel={() => setConfirmation(null)} onConfirm={() => remove(confirmation)} />}
    </section>
  )
}
export function ProductDetails({ productId }) {
  const { data } = useApp()
  const product = data.products.find((item) => item.id === productId)
  if (!product)
    return (
      <section className="surface">
        <EmptyState title="Product not found" text="The requested inventory record is unavailable." />
      </section>
    )
  const batches = data.batches.filter((item) => item.productId === product.id)
  const movements = data.transactions.filter((item) => item.productId === product.id)
  const fifo = fifoBatch(data.batches, product.id)
  return (
    <section className="page-stack">
      <a className="back-link" href="#/inventory">
        ← Back to inventory
      </a>
      <div className="detail-hero">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h2>{product.name}</h2>
          <p>
            {product.sku} · {product.supplier} · {product.leadTime} day lead time
          </p>
        </div>
        <StatusBadge>{getStockStatus(product)}</StatusBadge>
      </div>
      <div className="metric-grid product-metrics">
        <article>
          <small>Current stock</small>
          <strong>{product.stock}</strong>
          <span>{product.unit} available</span>
        </article>
        <article>
          <small>Reorder point</small>
          <strong>{product.reorderPoint}</strong>
          <span>{product.unit} minimum target</span>
        </article>
        <article>
          <small>Storage capacity</small>
          <strong>{product.capacity}</strong>
          <span>{Math.round((product.stock / product.capacity) * 100)}% utilized</span>
        </article>
        <article>
          <small>Average monthly sales</small>
          <strong>{product.monthlySales}</strong>
          <span>Recent baseline</span>
        </article>
      </div>
      {fifo && (
        <section className="fifo-callout">
          <span>⇢</span>
          <div>
            <p className="eyebrow">SUGGESTED FIFO BATCH</p>
            <strong>{fifo.number}</strong>
            <p>
              {fifo.quantity} available ·{' '}
              {fifo.expiresAt ? `Expires ${formatDate(fifo.expiresAt)}` : `Received ${formatDate(fifo.receivedAt)}`}
            </p>
          </div>
          <a href="#/stock-out" className="button primary">
            Start stock out
          </a>
        </section>
      )}
      <div className="two-column">
        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BATCHES</p>
              <h2>On-hand batches</h2>
            </div>
            <a href="#/batches">Manage batches</a>
          </div>
          {batches.length ? (
            <div className="compact-list">
              {batches.map((batch) => (
                <div key={batch.id}>
                  <div>
                    <strong>{batch.number}</strong>
                    <small>
                      Received {formatDate(batch.receivedAt)}{' '}
                      {batch.expiresAt && `· Expires ${formatDate(batch.expiresAt)}`}
                    </small>
                  </div>
                  <div>
                    <b>{batch.quantity}</b>
                    <StatusBadge>{getBatchStatus(batch)}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No batch records" />
          )}
        </section>
        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MOVEMENTS</p>
              <h2>Recent activity</h2>
            </div>
          </div>
          {movements.length ? (
            <div className="compact-list">
              {movements.slice(0, 5).map((movement) => (
                <div key={movement.id}>
                  <div>
                    <strong>
                      {movement.type} · {movement.quantity} {product.unit}
                    </strong>
                    <small>
                      {movement.id} · {formatDate(movement.date, true)}
                    </small>
                  </div>
                  <StatusBadge>{movement.status}</StatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No movements yet" />
          )}
        </section>
      </div>
    </section>
  )
}
function BatchForm({ initial, products, onClose, onSaved, notify, onBusyChange }) {
  const [form, setForm] = useState(initial || { productId: products[0]?.id || '', number: '', quantity: 0, receivedAt: new Date().toISOString().slice(0, 10), expiresAt: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    onBusyChange(true)
    try {
      const payload = { ...form, productId: String(form.productId), quantity: Number(form.quantity), expiresAt: form.expiresAt || null }
      if (initial) await inventoryService.updateBatch(initial.id, payload)
      else await inventoryService.createBatch(payload)
      notify(`Batch ${initial ? 'updated' : 'created'}.`)
      onSaved()
    } catch (exception) {
      setError(apiErrorMessage(exception))
    } finally {
      setSubmitting(false)
      onBusyChange(false)
    }
  }
  return <form className="surface compact-form" onSubmit={submit}>
    <div className="section-heading"><div><p className="eyebrow">{initial ? 'EDIT' : 'CREATE'}</p><h2>{initial ? 'Edit batch' : 'Add batch'}</h2></div><button type="button" className="inline-button" onClick={onClose} disabled={submitting}>Cancel</button></div>
    <div className="form-grid">{!initial && <label>Product<select disabled={submitting} value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>}<label>Batch number<input disabled={submitting} value={form.number} onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))} required /></label>{!initial && <label>Quantity<input disabled={submitting} type="number" min="0" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} required /></label>}<label>Received<input disabled={submitting} type="date" value={form.receivedAt} onChange={(event) => setForm((current) => ({ ...current, receivedAt: event.target.value }))} required /></label><label>Expiry<input disabled={submitting} type="date" value={form.expiresAt || ''} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} /></label></div>
    <FormError>{error}</FormError><AsyncButton className="button primary" loading={submitting} loadingLabel="Saving…">{initial ? 'Save batch' : 'Create batch'}</AsyncButton>
  </form>
}
export function Batches() {
  const { data, can, notify } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All batches')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const manage = can(PERMISSIONS.INVENTORY_EDIT)
  const remove = async (batch) => {
    try { await inventoryService.deleteBatch(batch.id); notify('Batch deleted.') } catch (exception) { notify(apiErrorMessage(exception), 'error') }
  }
  const rows = data.batches.filter((batch) => {
    const product = data.products.find((item) => item.id === batch.productId)
    return (
      (filter === 'All batches' || getBatchStatus(batch) === filter) &&
      `${batch.number} ${product?.name}`.toLowerCase().includes(search.toLowerCase())
    )
  })
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">BATCH CONTROL</p>
          <h2>FIFO and expiry management</h2>
          <p>Use the oldest valid stock first. Expired batches are automatically excluded from FIFO recommendations.</p>
        </div>
        {manage && <button className="button primary" disabled={saving} onClick={() => { setCreating(true); setEditing(null) }}>Add batch</button>}
      </div>
      {(creating || editing) && <BatchForm key={editing?.id || 'new'} onBusyChange={setSaving} initial={editing} products={data.products} notify={notify} onClose={() => { setCreating(false); setEditing(null) }} onSaved={() => { setCreating(false); setEditing(null) }} />}
      <section className="surface">
        <div className="filter-bar">
          <label className="search-field">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search batch or product"
            />
          </label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>All batches</option>
            <option>Available</option>
            <option>Expiring soon</option>
            <option>Expired</option>
            <option>Depleted</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Received</th>
                <th>Expiration</th>
                <th>Status</th>
                {manage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((batch) => {
                const product = data.products.find((item) => item.id === batch.productId)
                return (
                  <tr key={batch.id}>
                    <td>
                      <strong>{batch.number}</strong>
                    </td>
                    <td>
                      {product?.name}
                      <small>{product?.sku}</small>
                    </td>
                    <td>
                      {batch.quantity} {product?.unit}
                    </td>
                    <td>{formatDate(batch.receivedAt)}</td>
                    <td>
                      {batch.expiresAt ? (
                        <>
                          {formatDate(batch.expiresAt)}
                          <small>{daysUntil(batch.expiresAt)} days</small>
                        </>
                      ) : (
                        'Not applicable'
                      )}
                    </td>
                    <td>
                      <StatusBadge>{getBatchStatus(batch)}</StatusBadge>
                    </td>
                    {manage && <td><button className="inline-button" disabled={saving} onClick={() => { setEditing(batch); setCreating(false) }}>Edit</button><button className="inline-button" disabled={saving} onClick={() => setConfirmation(batch)}>Delete</button></td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!rows.length && <EmptyState title="No matching batches" />}
        </div>
      </section>
      {confirmation && <ConfirmDialog title="Delete batch?" message={`Delete ${confirmation.number}? Only empty batches without movement history can be deleted.`} confirmLabel="Delete batch" onCancel={() => setConfirmation(null)} onConfirm={() => remove(confirmation)} />}
    </section>
  )
}
