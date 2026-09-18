import { initialAdjustments, initialAudit, initialBatches, initialProducts, initialTransactions } from '../data/mockData'
import { fifoBatch, getBatchStatus, getStockStatus, today, validateMovement } from '../utils/inventoryLogic'

const clone = (value) => JSON.parse(JSON.stringify(value))
let state = clone({ products: initialProducts, batches: initialBatches, transactions: initialTransactions, adjustments: initialAdjustments, audit: initialAudit })
let listeners = []
const emit = () => listeners.forEach((listener) => listener(clone(state)))
const product = (id) => state.products.find((item) => item.id === id)
const stamp = () => new Date().toISOString()
const nextId = (prefix) => `${prefix}-${String(Date.now()).slice(-5)}`

export const inventoryService = {
  subscribe(listener) { listeners = [...listeners, listener]; listener(clone(state)); return () => { listeners = listeners.filter((item) => item !== listener) } },
  snapshot: () => clone(state),
  product: (id) => clone(product(id)),
  fifo: (productId) => clone(fifoBatch(state.batches, productId)),
  alerts() {
    const alerts = []
    state.products.forEach((item) => { if (item.stock <= item.reorderPoint) alerts.push({ id: `low-${item.id}`, type: 'Low Stock', product: item.name, detail: `${item.stock} ${item.unit} available; reorder point is ${item.reorderPoint}`, severity: 'High', date: stamp() }); if (item.stock >= item.capacity * .9) alerts.push({ id: `cap-${item.id}`, type: 'Capacity Threshold', product: item.name, detail: `${item.stock} of ${item.capacity} capacity used`, severity: 'Medium', date: stamp() }) })
    state.batches.forEach((batch) => { const status = getBatchStatus(batch); if (status === 'Expired' || status === 'Expiring soon') alerts.push({ id: `exp-${batch.id}`, type: status === 'Expired' ? 'Expired Stock' : 'Expiring Stock', product: product(batch.productId)?.name, detail: `${batch.number} — ${batch.quantity} remaining, expiry ${batch.expiresAt}`, severity: status === 'Expired' ? 'High' : 'Medium', date: stamp() }) })
    state.adjustments.filter((item) => item.status === 'Pending').forEach((item) => alerts.push({ id: `dis-${item.id}`, type: 'Inventory Discrepancy', product: product(item.productId)?.name, detail: `Adjustment ${item.id}: requested quantity ${item.requestedQty}`, severity: 'High', date: item.date }))
    return alerts
  },
  move({ type, productId, quantity, batchId, reference, reason, user }) {
    const item = product(productId); const batch = state.batches.find((entry) => entry.id === batchId); const error = validateMovement({ type, product: item, quantity, batch }); if (error) throw new Error(error)
    const amount = Number(quantity); const increases = ['Stock In', 'Return'].includes(type); item.stock += increases ? amount : -amount
    if (batch && ['Stock Out', 'Transfer'].includes(type)) batch.quantity -= amount
    if (batch && ['Stock In', 'Return'].includes(type)) batch.quantity += amount
    if (type === 'Stock In' && batchId === 'new') { const number = `REC-${String(Date.now()).slice(-5)}`; state.batches.push({ id: `b-${Date.now()}`, productId, number, quantity: amount, receivedAt: today, expiresAt: null }) }
    const transaction = { id: nextId('INV'), type, productId, quantity: amount, batch: batch?.number || 'N/A', date: stamp(), user: user.name, reference: reference || reason || 'Manual entry', status: 'Completed' }; state.transactions.unshift(transaction); state.audit.unshift({ id: nextId('AUD'), timestamp: transaction.date, user: user.name, department: user.department, roleLevel: user.roleLevel, action: type, module: 'Inventory', reference: transaction.id, description: `${item.name} — ${amount} ${item.unit}` }); emit(); return transaction
  },
  submitAdjustment({ productId, requestedQty, reason, user }) { const item = product(productId); if (!item || Number(requestedQty) < 0 || !reason.trim()) throw new Error('Product, non-negative count, and reason are required.'); const adjustment = { id: nextId('ADJ'), productId, systemQty: item.stock, requestedQty: Number(requestedQty), reason, requestedBy: user.name, status: 'Pending', date: today }; state.adjustments.unshift(adjustment); state.audit.unshift({ id: nextId('AUD'), timestamp: stamp(), user: user.name, department: user.department, roleLevel: user.roleLevel, action: 'Adjustment requested', module: 'Adjustments', reference: adjustment.id, description: reason }); emit(); return adjustment },
  reviewAdjustment(id, approved, user) { const adjustment = state.adjustments.find((entry) => entry.id === id); if (!adjustment || adjustment.status !== 'Pending') throw new Error('This request is no longer pending.'); adjustment.status = approved ? 'Approved' : 'Rejected'; if (approved) product(adjustment.productId).stock = adjustment.requestedQty; state.audit.unshift({ id: nextId('AUD'), timestamp: stamp(), user: user.name, department: user.department, roleLevel: user.roleLevel, action: approved ? 'Adjustment approved' : 'Adjustment rejected', module: 'Adjustments', reference: id, description: adjustment.reason }); emit() },
  reset() { state = clone({ products: initialProducts, batches: initialBatches, transactions: initialTransactions, adjustments: initialAdjustments, audit: initialAudit }); emit() },
}
