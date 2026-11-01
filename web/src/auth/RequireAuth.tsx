import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './context'
import { nextAuthStep, STEP_PATHS } from './steps'

function Loading() {
  return (
    <div className="center-screen" role="status">
      Caricamento…
    </div>
  )
}

/** Area riservata: richiede sessione con password + TOTP (aal2). */
export function RequireAuth() {
  const { session, assurance, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  const step = nextAuthStep(session, assurance)
  if (step !== 'ready') {
    return <Navigate to={STEP_PATHS[step]} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Pagine MFA: richiedono una sessione (aal1); se l'MFA è già completata si va alla home. */
export function RequireSession() {
  const { session, assurance, loading } = useAuth()

  if (loading) return <Loading />
  const step = nextAuthStep(session, assurance)
  if (step === 'login') return <Navigate to="/login" replace />
  if (step === 'ready') return <Navigate to="/" replace />
  return <Outlet />
}
