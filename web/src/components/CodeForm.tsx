import { useState, type SubmitEvent } from 'react'
import { isCompleteCode, normalizeCode } from '../auth/totp'

/** Campo per il codice TOTP a 6 cifre, con autocompilazione iOS. */
export function CodeForm({
  submitLabel,
  onSubmit,
}: {
  submitLabel: string
  onSubmit: (code: string) => Promise<string | null>
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handle(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isCompleteCode(code)) return
    setSubmitting(true)
    setError(null)
    const message = await onSubmit(code)
    setSubmitting(false)
    if (message) {
      setError(message)
      setCode('')
    }
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        void handle(e)
      }}
      noValidate
    >
      <label className="form__field">
        <span>Codice a 6 cifre</span>
        <input
          className="code-input"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={7}
          value={code}
          onChange={(e) => {
            setCode(normalizeCode(e.target.value))
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
        disabled={submitting || !isCompleteCode(code)}
      >
        {submitting ? 'Verifica in corso…' : submitLabel}
      </button>
    </form>
  )
}
