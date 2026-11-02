import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/context'
import { mfaErrorMessage } from '../auth/totp'
import { CodeForm } from './CodeForm'

interface Enrollment {
  factorId: string
  qrCode: string
  secret: string
  uri: string
}

/**
 * Registra un nuovo fattore TOTP: QR per il PC, link "otpauth" per aggiungerlo
 * direttamente all'app Password su iPhone, chiave da copiare come alternativa.
 */
export function TotpEnroll({
  friendlyName,
  onDone,
}: {
  friendlyName: string
  onDone: () => Promise<void> | void
}) {
  const { supabase } = useAuth()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    // StrictMode esegue gli effetti due volte in sviluppo: un solo enroll.
    if (started.current) return
    started.current = true
    void (async () => {
      // Rimuove eventuali fattori lasciati a metà da un tentativo precedente.
      const { data: factors } = await supabase.auth.mfa.listFactors()
      for (const factor of factors?.all ?? []) {
        if (factor.factor_type === 'totp' && factor.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName,
      })
      if (enrollError) {
        setError('Impossibile avviare la configurazione. Ricarica la pagina e riprova.')
        return
      }
      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      })
    })()
  }, [supabase, friendlyName])

  if (error) {
    return (
      <p className="form__error" role="alert">
        {error}
      </p>
    )
  }
  if (!enrollment) return <p role="status">Preparazione del codice…</p>

  return (
    <div className="enroll">
      <ol className="enroll__steps">
        <li>
          <strong>Su iPhone:</strong> tocca il pulsante e conferma nell&apos;app Password.
          <a className="button button--ghost" href={enrollment.uri}>
            Aggiungi all&apos;app Password
          </a>
        </li>
        <li>
          <strong>Su PC:</strong> inquadra il QR con l&apos;app Password o un&apos;app di
          autenticazione.
          <img className="enroll__qr" src={enrollment.qrCode} alt="Codice QR per l'autenticatore" />
        </li>
        <li>
          In alternativa inserisci a mano la chiave:{' '}
          <code className="enroll__secret" data-testid="totp-secret">
            {enrollment.secret}
          </code>
        </li>
        <li>Scrivi qui il codice a 6 cifre generato dall&apos;app.</li>
      </ol>
      <CodeForm
        submitLabel="Attiva"
        onSubmit={async (code) => {
          const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
            factorId: enrollment.factorId,
            code,
          })
          if (verifyError) return mfaErrorMessage(verifyError.code)
          await onDone()
          return null
        }}
      />
    </div>
  )
}
