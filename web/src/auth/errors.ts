/** Traduce gli errori di Supabase Auth in messaggi comprensibili. */
export function loginErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'invalid_credentials':
      return 'Email o password non corretti.'
    case 'email_not_confirmed':
      return 'Email non ancora confermata.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Troppi tentativi. Riprova tra qualche minuto.'
    default:
      return 'Accesso non riuscito. Controlla la connessione e riprova.'
  }
}
