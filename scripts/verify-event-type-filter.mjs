import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";

async function vendorOrder(page) {
  return page.locator("h3").allTextContents();
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
await page.goto(`${baseUrl}/discover`, { waitUntil: "networkidle" });

const originalOrder = await vendorOrder(page);
console.log("Original order:", originalOrder);

await page.getByRole("button", { name: "Event type" }).click();
await page.getByRole("listbox").getByText("Birthday party", { exact: true }).click();
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

const filteredOrder = await vendorOrder(page);
console.log("After selecting Birthday party:", filteredOrder);
console.log("Order changed?", JSON.stringify(filteredOrder) !== JSON.stringify(originalOrder));
console.log("Deccan Feast Caterers (the only Birthday-party vendor) now first?", filteredOrder[0]?.includes("Deccan Feast"));

const alsoAvailableVisible = await page.getByText("Also available").isVisible();
console.log('"Also available" divider shown?', alsoAvailableVisible);

const clearButton = page.getByRole("button", { name: "Clear all filters" });
console.log("Clear all filters button visible while a filter is active?", await clearButton.isVisible());
await clearButton.click();
await page.waitForTimeout(200);

const clearedOrder = await vendorOrder(page);
console.log("After Clear all filters:", clearedOrder);
console.log("Order restored to original?", JSON.stringify(clearedOrder) === JSON.stringify(originalOrder));

const clearButtonGoneAfterClear = await clearButton.isVisible().catch(() => false);
console.log("Clear all filters button hidden again once no filters active?", !clearButtonGoneAfterClear);

await browser.close();
