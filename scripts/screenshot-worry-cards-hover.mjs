import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const outDir = process.argv[3];

const browser = await chromium.launch();

async function scrollThroughWholePage(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 350) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(100);
  }
}

for (const [label, width] of [["mobile", 390], ["desktop", 1440]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await scrollThroughWholePage(page);

  const heading = page.getByRole("heading", { name: "Every host worries about three things" });
  const cardsSection = page.locator("section", { has: heading });
  await cardsSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  await cardsSection.screenshot({ path: `${outDir}/cards-rest-${label}.png` });

  if (label === "desktop") {
    const firstCard = cardsSection.locator(":scope > div > div").first();
    await firstCard.hover();
    await page.waitForTimeout(400);
    await cardsSection.screenshot({ path: `${outDir}/cards-hover-${label}.png` });
  }

  await page.close();
}

await browser.close();
