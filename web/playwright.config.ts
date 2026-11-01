import { defineConfig, devices } from '@playwright/test'

const port = 4173
// CHROMIUM_PATH: usa un Chromium già installato (ambiente dell'agente). In CI non serve.
const chromiumPath = process.env.CHROMIUM_PATH
const launchOptions = chromiumPath ? { executablePath: chromiumPath } : {}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    // L'ultimo profilo iPhone disponibile in Playwright, con WebKit (motore di Safari).
    { name: 'iphone-webkit', use: { ...devices['iPhone 15 Pro'] } },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions },
    },
  ],
  webServer: {
    command: `npm run preview`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
