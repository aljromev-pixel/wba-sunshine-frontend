import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/workflows.css'
import './styles/operations.css'
import App from './App'
import { AppProvider } from './context/AppContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider><App /></AppProvider>
  </StrictMode>,
)
