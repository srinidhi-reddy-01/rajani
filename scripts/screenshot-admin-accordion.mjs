import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const adminPassword = process.argv[3];
const vendorId = process.argv[4] ?? "877771c8-e5a9-43cc-9f31-92d9464b8270";
const outDir = process.argv[5];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
await page.getByLabel("Password").fill(adminPassword);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 10000 });

await page.goto(`${baseUrl}/admin/vendors/${vendorId}`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/admin-collapsed.png`, fullPage: true });

// Expand the first package and first menu category.
const firstPackageSummary = page.locator("summary").filter({ hasText: "₹" }).first();
await firstPackageSummary.click();
const firstCategorySummary = page.locator("summary").filter({ hasText: "item" }).first();
await firstCategorySummary.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/admin-expanded.png`, fullPage: true });

await browser.close();
