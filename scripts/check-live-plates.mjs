import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3000/discover", { waitUntil: "networkidle" });

const priceBefore = await page.locator("text=/Packages from/").first().textContent();
console.log("Price at 500 plates:", priceBefore);

// Click "+" on the plates chip 10 times (500 -> 1000, step 50)
const plusBtn = page.getByRole("button", { name: "Increase plates" });
for (let i = 0; i < 10; i++) await plusBtn.click();

const plateValue = await page.locator('input[type="number"]').first().inputValue();
console.log("Plates after 10 clicks:", plateValue);

const priceAfter = await page.locator("text=/Packages from/").first().textContent();
console.log("Price at 1000 plates:", priceAfter);

await browser.close();
