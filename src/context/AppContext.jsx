import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { demoUsers } from '../data/mockData'
import { inventoryService } from '../services/inventoryService'
import { can } from '../utils/permissions'

const AppContext = createContext(null)
export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('wba-user'))
    } catch {
      return null
    }
  })
  const [data, setData] = useState(inventoryService.snapshot())
  const [notice, setNotice] = useState(null)
  useEffect(() => inventoryService.subscribe(setData), [])
  useEffect(() => {
    if (user) sessionStorage.setItem('wba-user', JSON.stringify(user))
    else sessionStorage.removeItem('wba-user')
  }, [user])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(timer)
  }, [notice])
  const value = useMemo(
    () => ({
      user,
      setUser,
      users: demoUsers,
      data,
      alerts: inventoryService.alerts(),
      can: (permission) => can(user, permission),
      notify: (message, tone = 'success') => setNotice({ message, tone }),
      notice,
      logout: () => setUser(null),
    }),
    [user, data, notice]
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
export const useApp = () => useContext(AppContext)
