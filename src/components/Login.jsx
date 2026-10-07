import { useState } from 'react'
import { useApp } from '../context/AppContext'

export function Login() {
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ email, password })
    } catch (exception) {
      setError(exception.data?.errors?.email?.[0] || exception.message)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="sunshine-lockup">
          <span className="login-sun">☼</span>
          <span className="brand-wordmark">Sun<span>shine</span></span>
          <small>WALANGBROWNOUT APPLIANCES</small>
        </div>
        <p className="eyebrow">POWERING INVENTORY CLARITY</p>
        <h1>Reliable stock control, brilliantly connected.</h1>
        <p>Sunshine keeps every appliance, batch, and movement visible, accountable, and ready for the next demand.</p>
      </section>
      <section className="login-card" aria-labelledby="login-heading">
        <p className="eyebrow">SUNSHINE ACCESS</p>
        <h2 id="login-heading">Sign in to your workspace</h2>
        <p>Use your assigned email address and password to continue.</p>
        <form className="compact-form" onSubmit={submit}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}
