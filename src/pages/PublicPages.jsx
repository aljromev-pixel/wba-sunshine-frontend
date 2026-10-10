import { useRef, useState } from 'react'
import { SunshineBrand } from '../components/Login'
import { AsyncButton, FormError, FormField, useFormFeedback } from '../components/Shared'
import { authService } from '../services/authService'

export function Landing() {
  return <div className="public-page">
    <header className="public-header">
      <SunshineBrand />
      <nav aria-label="Account navigation">
        <a className="public-back" href="#/sign-in">Sign in</a>
        <a className="button primary" href="#/sign-up">Sign up</a>
      </nav>
    </header>
    <main id="main-content">
      <section className="public-hero" aria-labelledby="home-heading">
        <div>
          <p className="eyebrow">WALANGBROWNOUT APPLIANCES · SUNSHINE</p>
          <h1 id="home-heading">A brighter way to keep stock moving.</h1>
          <p>Bring your inventory, daily movements, and stock counts together in one connected workspace.</p>
          <div className="public-actions">
            <a className="button primary" href="#/sign-in">Sign in to your workspace →</a>
            <a className="button public-secondary" href="#/sign-up">Create an account</a>
          </div>
          <p className="public-caption">Already part of the team? Use your existing account to continue.</p>
        </div>
        <aside className="public-visual" aria-label="Inventory workflow overview">
          <span className="public-orbit" aria-hidden="true">☼</span>
          <p className="eyebrow">EVERY ITEM. EVERY MOVEMENT.</p>
          <h2>Clarity from arrival<br />to dispatch.</h2>
          <ol>
            <li><span>01</span><div><strong>Receive & organize</strong><p>Keep products and batches in view.</p></div></li>
            <li><span>02</span><div><strong>Track the movement</strong><p>Record stock entering and leaving.</p></div></li>
            <li><span>03</span><div><strong>Count with confidence</strong><p>Request and review stock corrections.</p></div></li>
          </ol>
        </aside>
      </section>
      <section className="public-features" aria-label="Workspace features">
        <article><span aria-hidden="true">◫</span><h2>Inventory visibility</h2><p>Find products, check stock levels, and monitor inventory alerts.</p></article>
        <article><span aria-hidden="true">⇄</span><h2>Connected workflows</h2><p>Manage stock movements and physical counts with clear records.</p></article>
        <article><span aria-hidden="true">✓</span><h2>Access for your role</h2><p>Your assigned role determines the tools available in your workspace.</p></article>
      </section>
    </main>
    <footer className="public-footer">Sunshine · Walangbrownout Appliances</footer>
  </div>
}

export function SignUp() {
  const [details, setDetails] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(false)
  const pending = useRef(false)
  const feedback = useFormFeedback()
  const update = (event) => setDetails((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current) return
    feedback.setError('')
    if (details.password !== details.password_confirmation) {
      feedback.setError('The passwords do not match.')
      return
    }
    pending.current = true
    setSubmitting(true)
    try {
      await authService.register(details)
      setDetails({ name: '', email: '', password: '', password_confirmation: '' })
      setCreated(true)
    } catch (exception) {
      feedback.handleError(exception)
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }
  return <main className="login-page">
    <section className="login-brand">
      <SunshineBrand />
      <p className="eyebrow">YOUR WORKSPACE STARTS HERE</p>
      <h1>Join the team. Keep inventory connected.</h1>
      <p>Create an account to access Sunshine with the Sales Staff role.</p>
    </section>
    <section className="login-card" aria-labelledby="signup-heading">
      <p className="eyebrow">SUNSHINE ACCESS</p>
      <h2 id="signup-heading">{created ? 'Your account is ready' : 'Create your account'}</h2>
      {created ? <>
        <p role="status">Account created successfully. You can now sign in with your email and password.</p>
        <a className="button primary" href="#/sign-in">Sign in</a>
      </> : <>
        <p>New accounts can view inventory and alerts and record Stock Out movements. An administrator manages changes to your role.</p>
        <form className="compact-form" onSubmit={submit}>
          <FormField name="name" feedback={feedback}>Full name<input value={details.name} onChange={update} required maxLength={255} autoComplete="name" disabled={submitting} /></FormField>
          <FormField name="email" feedback={feedback}>Email address<input type="email" value={details.email} onChange={update} required maxLength={255} autoComplete="email" disabled={submitting} /></FormField>
          <FormField name="password" feedback={feedback}>Password<input type="password" value={details.password} onChange={update} required minLength={12} maxLength={255} autoComplete="new-password" disabled={submitting} /><small>Use at least 12 characters.</small></FormField>
          <FormField name="password_confirmation" feedback={feedback}>Confirm password<input type="password" value={details.password_confirmation} onChange={update} required minLength={12} maxLength={255} autoComplete="new-password" disabled={submitting} /></FormField>
          <FormError>{feedback.error}</FormError>
          <AsyncButton className="button primary" loading={submitting} loadingLabel="Creating account…">Create account</AsyncButton>
        </form>
        <p className="public-account-link">Already have an account? <a href="#/sign-in">Sign in</a></p>
      </>}
      <a className="public-back" href="#/">← Back to home</a>
    </section>
  </main>
}
