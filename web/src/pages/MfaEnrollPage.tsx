import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { TotpEnroll } from '../components/TotpEnroll'

export function MfaEnrollPage() {
  const { supabase, refreshAssurance } = useAuth()
  const navigate = useNavigate()

  return (
    <main className="login">
      <div className="login__card">
        <h1 className="login__title">Attiva il secondo fattore</h1>
        <p className="login__subtitle">
          Per proteggere i dati bancari serve un codice temporaneo oltre alla password.
        </p>
        <TotpEnroll
          friendlyName="Spiccioli"
          onDone={async () => {
            await refreshAssurance()
            void navigate('/', { replace: true })
          }}
        />
        <button
          type="button"
          className="button button--ghost login__secondary"
          onClick={() => {
            void supabase.auth.signOut()
          }}
        >
          Esci
        </button>
      </div>
    </main>
  )
}
