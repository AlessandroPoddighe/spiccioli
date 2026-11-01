import { useState, type SubmitEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { loginErrorMessage } from '../auth/errors'
import { BuildBadge } from '../components/BuildBadge'

function isFromState(value: unknown): value is { from: string } {
  return (
    typeof value === 'object' && value !== null && 'from' in value && typeof value.from === 'string'
  )
}

export function LoginPage() {
  const { supabase, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const target = isFromState(location.state) ? location.state.from : '/'

  if (session) return <Navigate to={target} replace />

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        setError(loginErrorMessage(authError.code))
        return
      }
      void navigate(target, { replace: true })
    } catch {
      setError(loginErrorMessage(undefined))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login">
      <div className="login__card">
        <h1 className="login__title">Spiccioli</h1>
        <p className="login__subtitle">Le mie spese, sotto controllo.</p>
        <form
          className="form"
          onSubmit={(e) => {
            void onSubmit(e)
          }}
          noValidate
        >
          <label className="form__field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
            />
          </label>
          <label className="form__field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
            />
          </label>
          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button--primary"
            type="submit"
            disabled={submitting || !email.trim() || !password}
          >
            {submitting ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
      <BuildBadge />
    </main>
  )
}
