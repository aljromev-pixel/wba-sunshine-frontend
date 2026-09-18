import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

function App() {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="welcome-heading">
        <p className="eyebrow">WalangBrownout Appliances</p>
        <h1 id="welcome-heading">Inventory Management System</h1>
        <p>The workflow-driven inventory workspace is being prepared.</p>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
