import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { ConfigContext } from './config-context'
import type { AppConfig } from './env'
import { createSupabase } from './lib/supabase'
import { routes } from './routes'

export function App({ config }: { config: AppConfig }) {
  const supabase = useMemo(() => createSupabase(config), [config])
  const queryClient = useMemo(
    () =>
      new QueryClient({
        // Cache solo in memoria: nessuna persistenza dei dati sul dispositivo.
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
    [],
  )
  const router = useMemo(() => createBrowserRouter(routes), [])

  return (
    <ConfigContext value={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider supabase={supabase}>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ConfigContext>
  )
}
