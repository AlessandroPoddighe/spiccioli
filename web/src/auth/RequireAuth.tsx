import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './context'

/** Protegge le rotte interne: senza sessione si va al login. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="center-screen" role="status">
        Caricamento…
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
