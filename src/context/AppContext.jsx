import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { setAuthTokenProvider, setUnauthorizedHandler } from '../services/apiClient'
import { inventoryService } from '../services/inventoryService'
import { can } from '../utils/permissions'
import { apiErrorMessage } from '../utils/apiErrors'

const AppContext = createContext(null)
const tokenKey = 'wba-auth-token'
const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('')

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(inventoryService.snapshot())
  const [notice, setNotice] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(sessionStorage.getItem(tokenKey)))
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState('')
  const loadInventory = useCallback(async () => {
    setInventoryLoading(true)
    setInventoryError('')
    try {
      await inventoryService.load()
    } catch (exception) {
      setInventoryError(apiErrorMessage(exception))
    } finally {
      setInventoryLoading(false)
    }
  }, [])

  useEffect(() => inventoryService.subscribe(setData), [])
  useEffect(() => {
    setAuthTokenProvider(() => sessionStorage.getItem(tokenKey))
    setUnauthorizedHandler(() => {
      sessionStorage.removeItem(tokenKey)
      setUser(null)
      setAuthLoading(false)
      setInventoryError('')
      inventoryService.reset()
    })
    const token = sessionStorage.getItem(tokenKey)
    if (token) authService
      .me()
      .then(async ({ user: authenticatedUser }) => {
        setUser({ ...authenticatedUser, initials: initials(authenticatedUser.name) })
        await loadInventory()
      })
      .catch((exception) => setNotice({ message: apiErrorMessage(exception), tone: 'error' }))
      .finally(() => setAuthLoading(false))
    return () => {
      setAuthTokenProvider(null)
      setUnauthorizedHandler(null)
    }
  }, [loadInventory])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  const value = useMemo(
    () => ({
      user,
      authLoading,
      inventoryLoading,
      inventoryError,
      retryInventory: loadInventory,
      data,
      alerts: inventoryService.alerts(),
      can: (permission) => can(user, permission),
      notify: (message, tone = 'success') => setNotice({ message, tone }),
      notice,
      login: async (credentials) => {
        const { token, user: authenticatedUser } = await authService.login(credentials)
        sessionStorage.setItem(tokenKey, token)
        setUser({ ...authenticatedUser, initials: initials(authenticatedUser.name) })
        await loadInventory()
      },
      logout: async () => {
        try {
          await authService.logout()
        } catch {
          // Clear an already-invalid local session too.
        } finally {
          sessionStorage.removeItem(tokenKey)
          setUser(null)
          setInventoryError('')
          inventoryService.reset()
        }
      },
    }),
    [user, authLoading, inventoryLoading, inventoryError, loadInventory, data, notice]
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
export const useApp = () => useContext(AppContext)
