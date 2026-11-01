import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { UpdatePrompt } from './components/UpdatePrompt'
import { configResult } from './env'
import './index.css'
import { ConfigErrorPage } from './pages/ConfigErrorPage'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root mancante')

createRoot(root).render(
  <StrictMode>
    {configResult.ok ? (
      <App config={configResult.config} />
    ) : (
      <ConfigErrorPage missing={configResult.missing} />
    )}
    <UpdatePrompt />
  </StrictMode>,
)
