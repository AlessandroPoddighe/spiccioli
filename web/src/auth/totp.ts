/** Normalizza il codice inserito: solo cifre (iOS può incollare spazi). */
export function normalizeCode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6)
}

export function isCompleteCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/** Messaggi comprensibili per gli errori di verifica MFA. */
export function mfaErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'mfa_verification_failed':
    case 'mfa_challenge_expired':
      return 'Codice non valido o scaduto. Usa il codice attuale e riprova.'
    case 'mfa_verification_rejected':
      return 'Verifica rifiutata. Riprova tra qualche istante.'
    case 'over_request_rate_limit':
      return 'Troppi tentativi. Riprova tra qualche minuto.'
    default:
      return 'Verifica non riuscita. Controlla la connessione e riprova.'
  }
}
