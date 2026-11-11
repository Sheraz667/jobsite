import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import brandLogo from './assets/logo/logo2.png'
import './index.css'
import App from './App.tsx'

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
if (favicon) favicon.href = brandLogo

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
