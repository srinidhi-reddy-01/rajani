import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const vendorSlug = process.argv[3] ?? "tawalogy-by-shriji-rasoi-pure-veg-restaurant-catering-services";
const outDir = process.argv[4];

const browser = await chromium.launch();

async function scrollThroughWholePage(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
}

const pages = [
  { path: "/", name: "landing" },
  { path: "/discover", name: "discover" },
  { path: `/vendors/${vendorSlug}`, name: "vendor" },
];

for (const [label, width] of [["mobile", 390], ["desktop", 1440]]) {
  for (const { path, name } of pages) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    await scrollThroughWholePage(page);
    await page.screenshot({ path: `${outDir}/${name}-${label}.png`, fullPage: true });
    await page.close();
  }
}

await browser.close();
