import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const adminPassword = process.argv[3];
const vendorId = "a686b040-72d9-4be8-8c90-e122a0b8c8a2";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
await page.getByLabel("Password").fill(adminPassword);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 10000 });

await page.goto(`${baseUrl}/admin/vendors/${vendorId}`, { waitUntil: "networkidle" });

const packagesSection = page.locator("section", { has: page.getByRole("heading", { name: "Packages" }) });
const priceInputs = packagesSection.locator('input[name="base_price_pp"]');
const priceInputCount = await priceInputs.count();
console.log(`Price inputs in the Packages section (9 packages + 1 "add package" field expected = 10): ${priceInputCount}`);

const values = await priceInputs.evaluateAll((inputs) => inputs.map((i) => i.value));
const emptyCount = values.filter((v) => v === "").length;
console.log(`Empty price inputs: ${emptyCount} of ${values.length}`);

const unpricedBadges = await page.getByText("Unpriced — won't show on the public site").count();
console.log(`"Unpriced" badges shown: ${unpricedBadges}`);

const packageNames = await packagesSection.locator("h3.font-medium").allTextContents();
console.log(`Package names visible in admin: ${packageNames.join(", ")}`);

// Attempt to go live - should be blocked by the go-live gate.
const statusSelect = page.locator('select[name="status"]').first();
await statusSelect.selectOption("live");
const statusForm = page.locator('form:has(select[name="status"])').first();
await statusForm.locator('button[type="submit"]').click();
await page.waitForLoadState("networkidle");

const blockedMessage = await page.getByText(/Can't mark|missing/i).first().textContent().catch(() => null);
console.log(`Blocked message on redirect: ${blockedMessage}`);

await page.goto(`${baseUrl}/admin/vendors/${vendorId}`, { waitUntil: "networkidle" });
const statusAfter = await page.locator('select[name="status"]').first().inputValue();
console.log(`Vendor status after blocked attempt: ${statusAfter}`);

const gateMessage = await page.getByText(/Missing before this vendor can go live/i).textContent().catch(() => null);
console.log(`Gate message on vendor page: ${gateMessage}`);

await browser.close();
