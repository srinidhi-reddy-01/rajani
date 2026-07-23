import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const outDir = process.argv[3];

const browser = await chromium.launch();

async function scrollThroughWholePage(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  const step = 350;
  for (let y = 0; y < height; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
}

for (const [label, width] of [["mobile", 390], ["desktop", 1440]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  // Real incremental scroll so every whileInView reveal actually fires (once:true
  // means it stays revealed after), unlike a single scrollIntoViewIfNeeded jump.
  await scrollThroughWholePage(page);

  await page.screenshot({ path: `${outDir}/landing-full-${label}.png`, fullPage: true });

  const heading = page.getByRole("heading", { name: "Every host worries about three things" });
  const cardsSection = page.locator("section", { has: heading });
  await cardsSection.screenshot({ path: `${outDir}/value-prop-cards-${label}.png` });

  const band = page.getByText("You enjoy the event. We'll handle the food.").locator("xpath=ancestor::section[1]");
  await band.screenshot({ path: `${outDir}/value-prop-band-${label}.png` });

  await page.close();
}

await browser.close();
