import { apiClient } from './apiClient'
import { inventoryService } from './inventoryService'

export const userService = {
  list: () => apiClient.get('/v1/users').then((response) => response.data),
  async create(user) {
    const response = await apiClient.post('/v1/users', user)
    await inventoryService.refreshAfterWrite()
    return response.data
  },
  async update(id, user) {
    const response = await apiClient.put(`/v1/users/${id}`, user)
    await inventoryService.refreshAfterWrite()
    return response.data
  },
  async remove(id) {
    await apiClient.delete(`/v1/users/${id}`)
    await inventoryService.refreshAfterWrite()
  },
}
