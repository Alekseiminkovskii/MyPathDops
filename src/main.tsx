import { Buffer } from 'buffer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// @react-pdf/renderer's dependencies expect Node's Buffer global.
const globalWithBuffer = window as typeof window & { Buffer?: typeof Buffer }
globalWithBuffer.Buffer = globalWithBuffer.Buffer || Buffer

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)