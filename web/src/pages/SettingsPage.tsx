import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../auth/context'
import { TotpEnroll } from '../components/TotpEnroll'

export function SettingsPage() {
  const { supabase } = useAuth()
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)

  const factors = useQuery({
    queryKey: ['mfa-factors'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      return data.totp
    },
  })

  return (
    <section className="page">
      <h1 className="page__title">Altro</h1>
      <div className="card">
        <h2 className="card__title">Sicurezza</h2>
        <p>
          Dispositivi che generano il codice di verifica. Tienine almeno due: Supabase non fornisce
          codici di recupero.
        </p>
        {factors.isPending && <p role="status">Caricamento…</p>}
        {factors.isError && <p className="form__error">Impossibile leggere i dispositivi.</p>}
        {factors.data && (
          <ul className="list" data-testid="mfa-factors">
            {factors.data.map((f) => (
              <li key={f.id}>
                {f.friendly_name ?? 'Autenticatore'} ·{' '}
                <span className="muted">
                  aggiunto il {new Date(f.created_at).toLocaleDateString('it-IT')}
                </span>
              </li>
            ))}
          </ul>
        )}
        {adding ? (
          <TotpEnroll
            friendlyName={`Spiccioli ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`}
            onDone={async () => {
              setAdding(false)
              await queryClient.invalidateQueries({ queryKey: ['mfa-factors'] })
            }}
          />
        ) : (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              setAdding(true)
            }}
          >
            Aggiungi un dispositivo
          </button>
        )}
      </div>
    </section>
  )
}
