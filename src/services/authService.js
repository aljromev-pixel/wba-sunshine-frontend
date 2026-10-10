import { apiClient } from './apiClient'

export const authService = {
  register: (details) => apiClient.post('v1/auth/register', details),
  login: (credentials) => apiClient.post('v1/auth/login', credentials),
  me: (options) => apiClient.get('v1/auth/me', options),
  logout: () => apiClient.post('v1/auth/logout'),
}
