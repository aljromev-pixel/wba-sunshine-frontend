import { useApp } from '../context/AppContext'

export function Login() {
  const { users, setUser } = useApp()
  return <main className="login-page"><section className="login-brand"><div className="brand-mark large">WB</div><p className="eyebrow">WALANGBROWNOUT APPLIANCES</p><h1>Inventory, in full control.</h1><p>Workflow-driven stock management for every appliance, batch, and movement.</p><div className="login-points"><span>✓ FIFO-aware batches</span><span>✓ Controlled adjustments</span><span>✓ Role-specific workspace</span></div></section><section className="login-card" aria-labelledby="demo-login"><p className="eyebrow">DEMONSTRATION ACCESS</p><h2 id="demo-login">Choose a workspace</h2><p>Select a department and role level to experience its authorized interface.</p><div className="account-list">{users.map((user) => <button key={user.id} onClick={() => setUser(user)}><span className="avatar">{user.initials}</span><span><strong>{user.name}</strong><small>{user.department} • {user.roleLevel}</small></span><b>→</b></button>)}</div><small className="login-note">Demo accounts do not require passwords.</small></section></main>
}
