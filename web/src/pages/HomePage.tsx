import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/context'

interface SessionInfo {
  user_id: string | null
  aal: string
}

export function HomePage() {
  const { supabase } = useAuth()

  // Verifica end-to-end: il database vede l'utente e il livello MFA della sessione.
  const info = useQuery({
    queryKey: ['session-info'],
    queryFn: async () => {
      const result = await supabase.rpc('session_info')
      if (result.error) throw result.error
      return result.data as SessionInfo
    },
  })

  return (
    <section className="page">
      <h1 className="page__title">Questo mese</h1>
      <div className="card">
        <p>
          Benvenuto. Il collegamento delle banche arriverà nella Fase 3: per ora questa pagina
          conferma che accesso e deploy funzionano.
        </p>
        <p className="muted" data-testid="db-status">
          {info.isPending && 'Verifica del collegamento al database…'}
          {info.isError && 'Database non raggiungibile.'}
          {info.data && `Database collegato · sessione protetta (${info.data.aal})`}
        </p>
      </div>
    </section>
  )
}
