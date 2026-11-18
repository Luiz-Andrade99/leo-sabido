import { defineConfig, devices } from '@playwright/test';

/**
 * Testes E2E contra o build de homologação servido pelo `vite preview`.
 * Local (Windows): usa o Microsoft Edge instalado (PW_CHANNEL=msedge, padrão) — sem baixar navegadores.
 * CI: PW_CHANNEL=chromium e os projetos firefox/webkit após `npx playwright install --with-deps`.
 */
const channel = process.env.PW_CHANNEL ?? (process.env.CI ? 'chromium' : 'msedge');
const allEngines = process.env.PW_ALL_ENGINES === '1';
/** PW_DEVICES=1: celulares e tablets emulados (WebKit para iPhone/iPad, Chromium para Android). */
const mobile = process.env.PW_DEVICES === '1';
const android = channel === 'chromium' ? {} : { channel };
const DEVICES = [
  ['iphone-14-paisagem', devices['iPhone 14 landscape'], {}],
  ['iphone-14-retrato', devices['iPhone 14'], {}],
  ['ipad-retrato', devices['iPad (gen 7)'], {}],
  ['ipad-paisagem', devices['iPad (gen 7) landscape'], {}],
  ['android-pixel-7-paisagem', devices['Pixel 7 landscape'], android],
  ['android-pixel-7-retrato', devices['Pixel 7'], android],
  ['android-galaxy-tab-s4', devices['Galaxy Tab S4 landscape'], android],
] as const;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PW_BASE_URL ?? 'http://localhost:4173',
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: channel, use: { ...devices['Desktop Chrome'], ...(channel === 'chromium' ? {} : { channel }) } },
    ...(allEngines
      ? [
          // PW_FIREFOX_PATH: usa o Firefox instalado (protocolo WebDriver BiDi) quando o Firefox do Playwright não pode rodar.
          process.env.PW_FIREFOX_PATH
            ? { name: 'firefox', use: { ...devices['Desktop Firefox'], channel: 'moz-firefox', launchOptions: { executablePath: process.env.PW_FIREFOX_PATH } } }
            : { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
    ...(mobile ? DEVICES.map(([name, d, extra]) => ({ name, testMatch: /dispositivos\.spec\.ts/, use: { ...d, ...extra } })) : []),
  ],
});
