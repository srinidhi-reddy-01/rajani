import { chromium } from "playwright";

const url = process.argv[2];
const adminPassword = process.argv[3];

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.getByLabel("Password").fill(adminPassword);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 10000 });

await page.goto(url, { waitUntil: "networkidle" });
await page.locator('input[name="events_completed"]').fill("77");
await page.locator('input[name="is_verified"]').check();
await page.getByRole("button", { name: "Save profile" }).click();
await page.waitForTimeout(1500);

await page.reload({ waitUntil: "networkidle" });
const eventsVal = await page.locator('input[name="events_completed"]').inputValue();
const verifiedChecked = await page.locator('input[name="is_verified"]').isChecked();
console.log("events_completed after save+reload:", eventsVal);
console.log("is_verified after save+reload:", verifiedChecked);

await browser.close();
