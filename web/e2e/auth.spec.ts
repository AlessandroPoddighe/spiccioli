import { expect, test } from '@playwright/test'
import { freshTotp, totp } from './totp.ts'

// Richiede lo stack Supabase locale e gli utenti di prova creati dalla CI.
const password = process.env.E2E_PASSWORD
test.skip(!password, 'E2E_PASSWORD non impostata: stack Supabase locale non disponibile')

// Il flusso modifica lo stato dell'utente (fattore TOTP): niente retry automatici.
test.describe.configure({ retries: 0 })

test('accesso con password + attivazione e verifica del TOTP', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  const email = `e2e-${testInfo.project.name}@example.test`

  // 1. Password → l'app chiede di attivare il secondo fattore.
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password ?? '')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await expect(page).toHaveURL(/\/mfa\/attiva$/)

  // 2. Attivazione: QR e link per l'app Password, chiave leggibile.
  await expect(page.getByRole('link', { name: "Aggiungi all'app Password" })).toHaveAttribute(
    'href',
    /^otpauth:\/\/totp\//,
  )
  const secret = (await page.getByTestId('totp-secret').textContent())?.trim() ?? ''
  expect(secret).toMatch(/^[A-Z2-7]+=*$/)
  const firstCode = totp(secret)
  await page.getByLabel('Codice a 6 cifre').fill(firstCode)
  await page.getByRole('button', { name: 'Attiva' }).click()

  // 3. Area riservata: il database vede la sessione con aal2.
  await expect(page.getByRole('heading', { name: 'Questo mese' })).toBeVisible()
  await expect(page.getByTestId('db-status')).toHaveText(
    'Database collegato · sessione protetta (aal2)',
  )

  // 4. Uscita e nuovo accesso: ora serve il codice, non una nuova attivazione.
  await page.getByRole('button', { name: 'Esci' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password ?? '')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await expect(page).toHaveURL(/\/mfa\/verifica$/)

  // Un codice sbagliato viene rifiutato con un messaggio chiaro.
  await page.getByLabel('Codice a 6 cifre').fill('000000')
  await page.getByRole('button', { name: 'Verifica' }).click()
  await expect(page.getByRole('alert')).toContainText('Codice non valido')

  await page.getByLabel('Codice a 6 cifre').fill(await freshTotp(secret, firstCode))
  await page.getByRole('button', { name: 'Verifica' }).click()
  await expect(page.getByTestId('db-status')).toHaveText(
    'Database collegato · sessione protetta (aal2)',
  )

  // 5. Impostazioni: il dispositivo registrato compare nell'elenco.
  await page.goto('/impostazioni')
  await expect(page.getByTestId('mfa-factors')).toContainText('Spiccioli')
})

test('con la sola password non si accede ai dati', async ({ page }) => {
  // Un URL interno senza sessione porta sempre al login.
  await page.goto('/impostazioni')
  await expect(page).toHaveURL(/\/login$/)
})
