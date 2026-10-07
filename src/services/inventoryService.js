import { fifoBatch } from '../utils/inventoryLogic'
import { apiClient } from './apiClient'

const clone = (value) => JSON.parse(JSON.stringify(value))
const emptyState = { products: [], batches: [], transactions: [], adjustments: [], audit: [], alerts: [] }
let state = clone(emptyState)
let listeners = []
const emit = () => listeners.forEach((listener) => listener(clone(state)))
const normalizeIds = (inventory) => ({
  ...inventory,
  products: inventory.products.map((item) => ({ ...item, id: String(item.id) })),
  batches: inventory.batches.map((item) => ({ ...item, id: String(item.id), productId: String(item.productId) })),
  transactions: inventory.transactions.map((item) => ({ ...item, id: String(item.id), productId: String(item.productId) })),
  adjustments: inventory.adjustments.map((item) => ({
    ...item,
    id: String(item.id),
    productId: String(item.productId),
    requestedById: String(item.requestedById),
  })),
  audit: inventory.audit.map((item) => ({ ...item, id: String(item.id) })),
})
const applyState = (nextState) => {
  state = { ...emptyState, ...nextState }
  emit()
}

export const inventoryService = {
  subscribe(listener) {
    listeners = [...listeners, listener]
    listener(clone(state))
    return () => {
      listeners = listeners.filter((item) => item !== listener)
    }
  },
  snapshot: () => clone(state),
  product: (id) => clone(state.products.find((item) => item.id === id)),
  fifo: (productId) => clone(fifoBatch(state.batches, productId)),
  alerts: () => clone(state.alerts),
  async load() {
    const inventory = await apiClient.get('/v1/inventory')
    applyState(normalizeIds(inventory))
    return clone(state)
  },
  async move({ type, productId, quantity, batchId, reference }) {
    const response = await apiClient.post('/v1/inventory/movements', {
      type,
      productId: Number(productId),
      batchId: batchId === 'new' ? null : Number(batchId),
      quantity: Number(quantity),
      reference,
    })
    await this.load()
    return response.data
  },
  async submitAdjustment({ productId, requestedQty, reason }) {
    const response = await apiClient.post('/v1/inventory/adjustments', {
      productId: Number(productId),
      requestedQty: Number(requestedQty),
      reason,
    })
    await this.load()
    return response.data
  },
  async reviewAdjustment(id, approved) {
    const response = await apiClient.post(`/v1/inventory/adjustments/${id}/review`, { approved })
    await this.load()
    return response.data
  },
  async createProduct(product) {
    const response = await apiClient.post('/v1/products', product)
    await this.load()
    return response.data
  },
  async updateProduct(id, product) {
    const response = await apiClient.put(`/v1/products/${id}`, product)
    await this.load()
    return response.data
  },
  async deleteProduct(id) {
    await apiClient.delete(`/v1/products/${id}`)
    await this.load()
  },
  async createBatch(batch) {
    const response = await apiClient.post('/v1/batches', batch)
    await this.load()
    return response.data
  },
  async updateBatch(id, batch) {
    const response = await apiClient.put(`/v1/batches/${id}`, batch)
    await this.load()
    return response.data
  },
  async deleteBatch(id) {
    await apiClient.delete(`/v1/batches/${id}`)
    await this.load()
  },
  reset() {
    applyState(emptyState)
  },
}
