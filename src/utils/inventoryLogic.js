export const today = () => new Date().toISOString().slice(0, 10)
export const isExpired = (date) => Boolean(date) && date < today()
export const daysUntil = (date) =>
  Math.ceil((new Date(`${date}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000)
export const getStockStatus = (product) =>
  product.stock <= product.reorderPoint
    ? 'Low stock'
    : product.stock >= product.capacity * 0.9
      ? 'Near capacity'
      : 'In stock'
export const getBatchStatus = (batch) =>
  !batch.quantity
    ? 'Depleted'
    : isExpired(batch.expiresAt)
      ? 'Expired'
      : batch.expiresAt && daysUntil(batch.expiresAt) <= 30
        ? 'Expiring soon'
        : 'Available'
export const fifoBatch = (batches, productId) =>
  batches
    .filter((batch) => batch.productId === productId && batch.quantity > 0 && !isExpired(batch.expiresAt))
    .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))[0]
export const calculateReorder = ({ monthlySales, leadTime, safetyPercent, multiplier }) => {
  const dailyDemand = Number(monthlySales) / 30
  const safetyStock = dailyDemand * Number(leadTime) * (Number(safetyPercent) / 100)
  return { dailyDemand, safetyStock, reorderPoint: dailyDemand * Number(multiplier) * Number(leadTime) + safetyStock }
}
export const validateMovement = ({ type, product, quantity, batch }) => {
  if (!product) return 'Choose a product.'
  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) return 'Quantity must be a positive whole number.'
  if (['Stock Out', 'Transfer'].includes(type) && Number(quantity) > product.stock)
    return 'Quantity exceeds available stock.'
  if (batch && isExpired(batch.expiresAt)) return 'Expired batches cannot be used.'
  return null
}
