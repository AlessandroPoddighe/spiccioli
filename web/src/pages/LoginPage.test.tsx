import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import { ConfigContext } from '../config-context'
import type { AppSupabaseClient } from '../lib/supabase'
import { loginErrorMessage } from '../auth/errors'
import { LoginPage } from './LoginPage'

function renderLogin(signInWithPassword: ReturnType<typeof vi.fn>) {
  const supabase = { auth: { signInWithPassword } } as unknown as AppSupabaseClient
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/', element: <p>area riservata</p> },
    ],
    { initialEntries: ['/login'] },
  )
  render(
    <ConfigContext
      value={{
        supabaseUrl: 'https://x.supabase.co',
        supabasePublishableKey: 'sb_publishable_test',
        appEnv: 'local',
        buildInfo: 'test',
      }}
    >
      <AuthContext value={{ supabase, session: null, loading: false }}>
        <RouterProvider router={router} />
      </AuthContext>
    </ConfigContext>,
  )
}

describe('LoginPage', () => {
  it('disabilita il pulsante finché email e password sono vuote', () => {
    renderLogin(vi.fn())
    expect(screen.getByRole('button', { name: 'Accedi' })).toBeDisabled()
  })

  it('mostra un errore leggibile con credenziali errate', async () => {
    const signIn = vi
      .fn()
      .mockResolvedValue({ error: { code: 'invalid_credentials', message: 'x' } })
    renderLogin(signIn)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), ' io@example.com ')
    await user.type(screen.getByLabelText('Password'), 'sbagliata')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))

    expect(signIn).toHaveBeenCalledWith({ email: 'io@example.com', password: 'sbagliata' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Email o password non corretti.')
  })

  it("dopo l'accesso porta all'area riservata", async () => {
    const signIn = vi.fn().mockResolvedValue({ error: null })
    renderLogin(signIn)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'io@example.com')
    await user.type(screen.getByLabelText('Password'), 'giusta-e-lunga')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))
    expect(await screen.findByText('area riservata')).toBeInTheDocument()
  })
})

describe('loginErrorMessage', () => {
  it('ha un messaggio generico per errori sconosciuti', () => {
    expect(loginErrorMessage('boh')).toMatch(/Accesso non riuscito/)
  })
})
