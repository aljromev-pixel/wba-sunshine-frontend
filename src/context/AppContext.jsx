import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { setAuthTokenProvider, setUnauthorizedHandler } from '../services/apiClient'
import { inventoryService } from '../services/inventoryService'
import { can } from '../utils/permissions'

const AppContext = createContext(null)
const tokenKey = 'wba-auth-token'
const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('')

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(inventoryService.snapshot())
  const [notice, setNotice] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(sessionStorage.getItem(tokenKey)))

  useEffect(() => inventoryService.subscribe(setData), [])
  useEffect(() => {
    setAuthTokenProvider(() => sessionStorage.getItem(tokenKey))
    setUnauthorizedHandler(() => {
      sessionStorage.removeItem(tokenKey)
      setUser(null)
      setAuthLoading(false)
    })
    const token = sessionStorage.getItem(tokenKey)
    if (!token) return
    authService
      .me()
      .then(async ({ user: authenticatedUser }) => {
        setUser({ ...authenticatedUser, initials: initials(authenticatedUser.name) })
        await inventoryService.load()
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
    return () => {
      setAuthTokenProvider(null)
      setUnauthorizedHandler(null)
    }
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  const value = useMemo(
    () => ({
      user,
      authLoading,
      data,
      alerts: inventoryService.alerts(),
      can: (permission) => can(user, permission),
      notify: (message, tone = 'success') => setNotice({ message, tone }),
      notice,
      login: async (credentials) => {
        const { token, user: authenticatedUser } = await authService.login(credentials)
        sessionStorage.setItem(tokenKey, token)
        setUser({ ...authenticatedUser, initials: initials(authenticatedUser.name) })
        await inventoryService.load()
      },
      logout: async () => {
        try {
          await authService.logout()
        } catch {
          // Clear an already-invalid local session too.
        } finally {
          sessionStorage.removeItem(tokenKey)
          setUser(null)
          inventoryService.reset()
        }
      },
    }),
    [user, authLoading, data, notice]
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
export const useApp = () => useContext(AppContext)
