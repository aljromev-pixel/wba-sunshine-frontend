import { apiClient } from './apiClient'

export const userService = {
  list: () => apiClient.get('/v1/users').then((response) => response.data),
  create: (user) => apiClient.post('/v1/users', user).then((response) => response.data),
  update: (id, user) => apiClient.put(`/v1/users/${id}`, user).then((response) => response.data),
  remove: (id) => apiClient.delete(`/v1/users/${id}`),
}
