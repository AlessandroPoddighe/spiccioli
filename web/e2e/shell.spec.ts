import { expect, test } from '@playwright/test'

test.describe('pagina di accesso', () => {
  test('senza sessione reindirizza al login', async ({ page }) => {
    await page.goto('/movimenti')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Spiccioli' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accedi' })).toBeDisabled()
  })

  test('nessuno scorrimento orizzontale e campi ≥ 16px (niente zoom su iOS)', async ({ page }) => {
    await page.goto('/login')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    const fontSize = await page
      .getByLabel('Email')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(fontSize).toBeGreaterThanOrEqual(16)
  })

  test('metadati PWA e safe area per iPhone', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /viewport-fit=cover/,
    )
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/apple-touch-icon.png',
    )
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)
    const manifest = await page.request.get('/manifest.webmanifest')
    expect(manifest.ok()).toBe(true)
    const body = (await manifest.json()) as { display: string; lang: string }
    expect(body.display).toBe('standalone')
    expect(body.lang).toBe('it')
  })

  test('il badge mostra la versione del build', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByTestId('build-badge')).toBeVisible()
  })
})
