import { useEffect, useState } from 'react'
import { AppLayout } from './components/AppLayout'
import { Login } from './components/Login'
import { useApp } from './context/AppContext'
import { PERMISSIONS } from './utils/permissions'
import { Dashboard } from './pages/Dashboard'
import { Batches, InventoryList, ProductDetails } from './pages/InventoryPages'
import { Adjustments, CycleCount, MovementForm } from './pages/WorkflowPages'
import { Alerts, AuditTrail, ReorderCalculator, Reports, Users } from './pages/OperationsPages'

const permissions = { '/inventory': PERMISSIONS.INVENTORY_VIEW, '/batches': PERMISSIONS.FIFO_VIEW, '/stock-in': PERMISSIONS.STOCK_IN, '/stock-out': PERMISSIONS.STOCK_OUT, '/transfers': PERMISSIONS.TRANSFER_CREATE, '/returns': PERMISSIONS.RETURNS_CREATE, '/cycle-count': PERMISSIONS.CYCLE_COUNT, '/adjustments': PERMISSIONS.ADJUSTMENT_REQUEST, '/alerts': PERMISSIONS.ALERTS_VIEW, '/reorder-calculator': PERMISSIONS.REORDER_CALCULATE, '/reports': PERMISSIONS.REPORTS_VIEW, '/audit-trail': PERMISSIONS.AUDIT_VIEW, '/users': PERMISSIONS.USERS_MANAGE }
function NotReady({ label }) { return <section className="surface empty-state"><span>◫</span><h2>{label}</h2><p>This authorized workspace is being loaded.</p></section> }
export default function App() {
  const { user, can } = useApp(); const [path, setPath] = useState(() => window.location.hash.slice(1) || '/dashboard')
  useEffect(() => { const update = () => setPath(window.location.hash.slice(1) || '/dashboard'); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  if (!user) return <Login />
  const basePath = path.startsWith('/inventory/') ? '/inventory' : path; const needed = permissions[basePath]
  const view = needed && !can(needed) ? <section className="surface forbidden"><p className="eyebrow">ACCESS RESTRICTED</p><h2>This module is not part of your assigned workspace.</h2><a className="button primary" href="#/dashboard">Return to dashboard</a></section> : path === '/dashboard' ? <Dashboard /> : path === '/inventory' ? <InventoryList /> : path.startsWith('/inventory/') ? <ProductDetails productId={path.split('/').pop()} /> : path === '/batches' ? <Batches /> : path === '/stock-in' ? <MovementForm type="Stock In" /> : path === '/stock-out' ? <MovementForm type="Stock Out" /> : path === '/transfers' ? <MovementForm type="Transfer" /> : path === '/returns' ? <MovementForm type="Return" /> : path === '/cycle-count' ? <CycleCount /> : path === '/adjustments' ? <Adjustments /> : path === '/alerts' ? <Alerts /> : path === '/reorder-calculator' ? <ReorderCalculator /> : path === '/reports' ? <Reports /> : path === '/audit-trail' ? <AuditTrail /> : path === '/users' ? <Users /> : <NotReady label={basePath.slice(1).replaceAll('-', ' ')} />
  return <AppLayout path={path}>{view}</AppLayout>
}
