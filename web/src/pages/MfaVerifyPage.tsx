import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { mfaErrorMessage } from '../auth/totp'
import { CodeForm } from '../components/CodeForm'

export function MfaVerifyPage() {
  const { supabase, refreshAssurance } = useAuth()
  const navigate = useNavigate()

  async function verify(code: string): Promise<string | null> {
    const { data, error } = await supabase.auth.mfa.listFactors()
    const factors = data?.totp ?? []
    if (error || factors.length === 0) return mfaErrorMessage(undefined)
    // Con più fattori (iPhone + secondo dispositivo) va bene il primo che accetta il codice.
    let lastError: string | undefined
    for (const factor of factors) {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
      if (!result.error) {
        await refreshAssurance()
        void navigate('/', { replace: true })
        return null
      }
      lastError = result.error.code
    }
    return mfaErrorMessage(lastError)
  }

  return (
    <main className="login">
      <div className="login__card">
        <h1 className="login__title">Codice di verifica</h1>
        <p className="login__subtitle">Apri l&apos;app Password e inserisci il codice attuale.</p>
        <CodeForm submitLabel="Verifica" onSubmit={verify} />
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
