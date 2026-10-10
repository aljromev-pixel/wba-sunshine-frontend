import { useState } from 'react'
import { FormField, useFormFeedback, AsyncButton, ConfirmDialog, EmptyState, FormError, StatusBadge, formatDate } from '../components/Shared'
import { useApp } from '../context/AppContext'
import { inventoryService } from '../services/inventoryService'
import { fifoBatch, getBatchStatus } from '../utils/inventoryLogic'
import { PERMISSIONS } from '../utils/permissions'

const config = {
  'Stock In': {
    note: 'Record received goods into the single warehouse. Add a supplier reference for traceability.',
    action: 'Record stock in',
  },
  'Stock Out': {
    note: 'Use available stock only. The oldest valid FIFO batch is selected automatically when applicable.',
    action: 'Complete stock out',
  },
  Transfer: { note: 'Record a controlled transfer movement within the warehouse workflow.', action: 'Record transfer' },
  Return: { note: 'Return accepted stock to inventory after verification.', action: 'Process return' },
}
export function MovementForm({ type }) {
  const { data, notify } = useApp()
  const [productId, setProductId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reference, setReference] = useState('')
  const feedback = useFormFeedback()
  const { error, setError, handleError } = feedback
  const [submitting, setSubmitting] = useState(false)
  const product = data.products.find((item) => item.id === productId)
  const batches = data.batches.filter((item) => item.productId === productId)
  const suggested = productId ? fifoBatch(data.batches, productId) : null
  const chooseProduct = (id) => {
    setProductId(id)
    const suggestion = fifoBatch(data.batches, id)
    setBatchId(suggestion?.id || (type === 'Stock In' ? 'new' : ''))
  }
  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const transaction = await inventoryService.move({ type, productId, quantity, batchId, reference })
      notify(`${type} recorded as ${transaction.id}.`)
      setProductId('')
      setBatchId('')
      setQuantity('')
      setReference('')
    } catch (exception) {
      handleError(exception)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <section className="page-stack workflow-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">WAREHOUSE WORKFLOW</p>
          <h2>{type} transaction</h2>
          <p>{config[type].note}</p>
        </div>
      </div>
      <form className="surface transaction-form" onSubmit={submit}>
        <div className="form-grid">
          <FormField name="productId" feedback={feedback}>
            Product
            <select disabled={submitting} value={productId} onChange={(event) => chooseProduct(event.target.value)} required>
              <option value="">Select a product</option>
              {data.products.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} — {item.stock} available
                </option>
              ))}
            </select>
          </FormField>
          <FormField name="quantity" feedback={feedback}>
            Quantity
            <input disabled={submitting}
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              placeholder="Enter quantity"
            />
          </FormField>
          <FormField name="batchId" feedback={feedback}>
            Batch
            {type === 'Stock In' ? (
              <select disabled={submitting} value={batchId} onChange={(event) => setBatchId(event.target.value)}>
                <option value="new">Create receiving batch</option>
                {batches.map((batch) => (
                  <option value={batch.id} key={batch.id}>
                    {batch.number} — {batch.quantity} available
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
                required
                disabled={submitting || !productId}
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option value={batch.id} key={batch.id} disabled={getBatchStatus(batch) === 'Expired'}>
                    {batch.number} — {getBatchStatus(batch)}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField name="reference" feedback={feedback}>
            Reference / reason
            <input disabled={submitting}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              required
              placeholder={type === 'Stock Out' ? 'Sales order or reference' : 'Enter reference'}
            />
          </FormField>
        </div>
        {product && (
          <div className="form-context">
            <span>
              Available stock:{' '}
              <strong>
                {product.stock} {product.unit}
              </strong>
            </span>
            {suggested && type !== 'Stock In' && (
              <span>
                FIFO suggestion: <strong>{suggested.number}</strong> · {suggested.quantity} available
              </span>
            )}
          </div>
        )}
        {error && (
          <FormError>{error}</FormError>
        )}
        <div className="form-actions">
          <AsyncButton type="submit" className="button primary" loading={submitting} loadingLabel="Saving…">{config[type].action}</AsyncButton>
        </div>
      </form>
    </section>
  )
}
export function CycleCount() {
  const { data, notify } = useApp()
  const [productId, setProductId] = useState(data.products[0]?.id || '')
  const [counted, setCounted] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const feedback = useFormFeedback()
  const { error, setError, handleError } = feedback
  const product = data.products.find((item) => item.id === productId) || data.products[0]
  const variance = !product || counted === '' ? null : Number(counted) - product.stock
  const submit = async (event) => {
    event.preventDefault()
    if (submitting || !product || counted === '' || !Number.isInteger(Number(counted)) || Number(counted) < 0) return
    setError('')
    setSubmitting(true)
    const reason = `Cycle count: system ${product.stock}, counted ${counted}`
    try {
      const request = await inventoryService.submitAdjustment({ productId: product.id, requestedQty: counted, reason })
      setSubmitted(request)
      notify(`Cycle count submitted as ${request.id}; review is required.`)
    } catch (exception) {
      handleError(exception)
    } finally {
      setSubmitting(false)
    }
  }
  if (!product) return <section className="surface"><EmptyState title="No products to count" text="Add a product before submitting a cycle count." /></section>
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">VERIFICATION WORKFLOW</p>
          <h2>Cycle count</h2>
          <p>
            Compare a physical count with the system quantity. Variances are submitted as adjustment requests for
            review.
          </p>
        </div>
      </div>
      <form className="surface count-card" onSubmit={submit}>
        <FormField name="productId" feedback={feedback}>
          Product
          <select disabled={submitting}
            value={product.id}
            onChange={(event) => {
              setProductId(event.target.value)
              setCounted('')
              setSubmitted(null)
            }}
          >
            {data.products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>
        <div className="count-comparison">
          <article>
            <small>System quantity</small>
            <strong>{product?.stock}</strong>
            <span>{product?.unit}</span>
          </article>
          <article>
            <FormField name="requestedQty" feedback={feedback}>Counted quantity
            <input disabled={submitting}
              type="number"
              min="0"
              value={counted}
              onChange={(event) => setCounted(event.target.value)}
              step="1"
              placeholder="Enter count"
              required
            />
            </FormField>
          </article>
          <article className={variance ? 'variance' : ''}>
            <small>Variance</small>
            <strong>{variance === null ? '—' : variance > 0 ? `+${variance}` : variance}</strong>
            <span>{variance === null ? 'Awaiting count' : variance === 0 ? 'Matched' : 'Requires review'}</span>
          </article>
        </div>
        <div className="form-actions">
          <AsyncButton className="button primary" loading={submitting} loadingLabel="Submitting…">Submit count result</AsyncButton>
        </div>
        <FormError>{error}</FormError>
        {submitted && (
          <p className="success-note">
            Submitted {submitted.id}. The inventory quantity remains unchanged until an authorized reviewer approves it.
          </p>
        )}
      </form>
    </section>
  )
}
export function Adjustments() {
  const { data, user, can, notify } = useApp()
  const [productId, setProductId] = useState('')
  const [requestedQty, setRequestedQty] = useState('')
  const [reason, setReason] = useState('')
  const feedback = useFormFeedback()
  const { error, setError, handleError } = feedback
  const [submitting, setSubmitting] = useState(false)
  const [reviewing, setReviewing] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const approve = can(PERMISSIONS.ADJUSTMENT_APPROVE)
  const request = can(PERMISSIONS.ADJUSTMENT_REQUEST)
  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const item = await inventoryService.submitAdjustment({ productId, requestedQty, reason })
      notify(`Adjustment request ${item.id} submitted.`)
      setProductId('')
      setRequestedQty('')
      setReason('')
      setError('')
    } catch (exception) {
      handleError(exception)
    } finally {
      setSubmitting(false)
    }
  }
  const review = async (id, decision) => {
    setReviewing(id)
    try {
      await inventoryService.reviewAdjustment(id, decision)
      notify(`Adjustment request ${decision ? 'approved and applied' : 'rejected'}.`)
    } finally {
      setReviewing(null)
    }
  }
  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">CONTROLLED CHANGES</p>
          <h2>Inventory adjustments</h2>
          <p>
            Staff submit requests; only authorized supervisors, purchasing managers, or administrators can approve an
            inventory change.
          </p>
        </div>
      </div>
      <div className="two-column adjustments-grid">
        {request && <form className="surface compact-form" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">REQUEST</p>
              <h2>Submit adjustment</h2>
            </div>
          </div>
          <FormField name="productId" feedback={feedback}>
            Product
            <select disabled={submitting} value={productId} onChange={(event) => setProductId(event.target.value)} required>
              <option value="">Select a product</option>
              {data.products.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} — system: {item.stock}
                </option>
              ))}
            </select>
          </FormField>
          <FormField name="requestedQty" feedback={feedback}>
            Verified quantity
            <input disabled={submitting}
              type="number"
              min="0"
              value={requestedQty}
              onChange={(event) => setRequestedQty(event.target.value)}
              required
            />
          </FormField>
          <FormField name="reason" feedback={feedback}>
            Reason
            <textarea disabled={submitting}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              placeholder="Describe the count variance, damage, or other reason"
            />
          </FormField>
          <FormError>{error}</FormError>
          <AsyncButton className="button primary" loading={submitting} loadingLabel="Submitting…">Submit for review</AsyncButton>
        </form>}
        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">REVIEW QUEUE</p>
              <h2>{approve ? 'Approve or reject requests' : 'Request status'}</h2>
            </div>
          </div>
          <div className="compact-list">
            {data.adjustments.map((item) => {
              const product = data.products.find((entry) => entry.id === item.productId)
              return (
                <div key={item.id} className="adjustment-row">
                  <div>
                    <strong>
                      {item.id} · {product?.name}
                    </strong>
                    <small>
                      System {item.systemQty} → requested {item.requestedQty} · {item.requestedBy}
                    </small>
                    <small>{item.reason}</small>
                  </div>
                  <div>
                    {item.status === 'Pending' && approve && item.requestedById !== String(user?.id) ? (
                      <span className="review-actions">
                        <button disabled={reviewing === item.id} onClick={() => setConfirmation({ id: item.id, decision: true })}>Approve</button>
                        <button disabled={reviewing === item.id} onClick={() => setConfirmation({ id: item.id, decision: false })}>Reject</button>
                      </span>
                    ) : item.status === 'Pending' && approve ? (
                      <small>Another authorized user must review this request.</small>
                    ) : (
                      <StatusBadge>{item.status}</StatusBadge>
                    )}
                  </div>
                </div>
              )
            })}
            {!data.adjustments.length && <EmptyState title="No adjustment requests" />}
          </div>
        </section>
      </div>
      {confirmation && <ConfirmDialog title={`${confirmation.decision ? 'Approve' : 'Reject'} adjustment?`} message="This decision will be recorded in the audit trail." confirmLabel={confirmation.decision ? 'Approve' : 'Reject'} onCancel={() => setConfirmation(null)} onConfirm={() => review(confirmation.id, confirmation.decision)} />}
    </section>
  )
}
