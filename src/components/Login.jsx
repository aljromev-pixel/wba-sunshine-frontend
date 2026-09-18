import { useApp } from '../context/AppContext'

export function Login() {
  const { users, setUser } = useApp()
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="sunshine-lockup">
          <span className="login-sun">☼</span>
          <span className="brand-wordmark" aria-label="Sunshine">
            Sun<span>shine</span>
          </span>
          <small>WALANGBROWNOUT APPLIANCES</small>
        </div>
        <p className="eyebrow">POWERING INVENTORY CLARITY</p>
        <h1>Reliable stock control, brilliantly connected.</h1>
        <p>Sunshine keeps every appliance, batch, and movement visible, accountable, and ready for the next demand.</p>
        <div className="login-points">
          <span>✓ FIFO-aware batches</span>
          <span>✓ Controlled adjustments</span>
          <span>✓ Role-specific workspace</span>
        </div>
      </section>
      <section className="login-card" aria-labelledby="demo-login">
        <p className="eyebrow">SUNSHINE DEMO ACCESS</p>
        <h2 id="demo-login">Choose your workspace</h2>
        <p>Select a department and role level to experience its authorized interface.</p>
        <div className="account-list">
          {users.map((user) => (
            <button key={user.id} onClick={() => setUser(user)}>
              <span className="avatar">{user.initials}</span>
              <span>
                <strong>{user.name}</strong>
                <small>
                  {user.department} • {user.roleLevel}
                </small>
              </span>
              <b>→</b>
            </button>
          ))}
        </div>
        <small className="login-note">Demo accounts do not require passwords.</small>
      </section>
    </main>
  )
}
