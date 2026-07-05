# Agent Notes

## Visual Inspection

When changing the Slack UI or dashboard, run a real browser smoke pass before finalizing.

Use the Playwright install already available on this VM:

```js
import { chromium } from '/home/yaroslav_volovich/projects/question-constellation/tmp/learning-home-course-map/node_modules/playwright/index.mjs';
```

Launch system Chrome:

```js
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  args: ['--no-sandbox']
});
```

For each route and viewport, create a browser context, open the local Svelte app, wait briefly, check visible body text, and save a full-page screenshot:

```js
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  isMobile: false,
  hasTouch: false,
  deviceScaleFactor: 1
});

const page = await context.newPage();
await page.goto(`${baseUrl}/dashboard`, {
  waitUntil: 'domcontentloaded',
  timeout: 45_000
});
await page.waitForTimeout(1200);
const body = await page.locator('body').innerText();
await page.screenshot({ path: 'artifacts/screenshots/dashboard-desktop.png', fullPage: true });
```

Create a contact sheet with ImageMagick:

```bash
montage artifacts/screenshots/live-smoke/*.png \
  -thumbnail 360x520 \
  -tile 3x3 \
  -geometry +14+14 \
  -background '#111827' \
  artifacts/screenshots/live-smoke/contact.png
```

Open the contact sheet with `view_image` and fix visible issues before finishing: cut-off buttons, overlapping text, nested-card clutter, repeated showcase panels, event-specific copy, or UI that would not make sense to an enterprise user. Update the screenshots referenced from `README.md` after the UI changes.
