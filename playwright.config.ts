import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry"
  },
  webServer: {
    command: "VITE_CONTENT_SOURCE=static npm run dev -- --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
