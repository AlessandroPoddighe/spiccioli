import type { RouteObject } from 'react-router'
import { RequireAuth, RequireSession } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MfaEnrollPage } from './pages/MfaEnrollPage'
import { MfaVerifyPage } from './pages/MfaVerifyPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/mfa',
    element: <RequireSession />,
    children: [
      { path: 'attiva', element: <MfaEnrollPage /> },
      { path: 'verifica', element: <MfaVerifyPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'movimenti', element: <PlaceholderPage title="Movimenti" phase={4} /> },
          { path: 'analisi', element: <PlaceholderPage title="Analisi" phase={6} /> },
          { path: 'banche', element: <PlaceholderPage title="Banche" phase={3} /> },
          { path: 'impostazioni', element: <SettingsPage /> },
          { path: '*', element: <PlaceholderPage title="Pagina non trovata" phase={0} /> },
        ],
      },
    ],
  },
]
