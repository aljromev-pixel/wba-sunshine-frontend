import { apiClient } from './apiClient'

export const authService = {
  login: (credentials) => apiClient.post('v1/auth/login', credentials),
  me: () => apiClient.get('v1/auth/me'),
  logout: () => apiClient.post('v1/auth/logout'),
}
