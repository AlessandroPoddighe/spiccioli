import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/context'
import { BuildBadge } from './BuildBadge'
import { NAV_ITEMS } from './nav'

export function AppLayout() {
  const { supabase, session } = useAuth()

  return (
    <div className="shell">
      <header className="shell__header">
        <span className="shell__brand">Spiccioli</span>
        <span className="shell__user" title={session?.user.email}>
          {session?.user.email}
        </span>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            void supabase.auth.signOut()
          }}
        >
          Esci
        </button>
      </header>

      <nav className="shell__nav" aria-label="Navigazione principale">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
          >
            <span className="nav-item__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="nav-item__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="shell__main">
        <Outlet />
        <BuildBadge />
      </main>
    </div>
  )
}
