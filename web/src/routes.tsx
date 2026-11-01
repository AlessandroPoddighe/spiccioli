import type { RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
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
          { path: 'impostazioni', element: <PlaceholderPage title="Altro" phase={7} /> },
          { path: '*', element: <PlaceholderPage title="Pagina non trovata" phase={0} /> },
        ],
      },
    ],
  },
]
