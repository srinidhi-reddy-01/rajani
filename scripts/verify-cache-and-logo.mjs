import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const adminPassword = process.argv[3];
const vendorId = "877771c8-e5a9-43cc-9f31-92d9464b8270";
const newEventsCompleted = "137";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
await page.getByLabel("Password").fill(adminPassword);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 10000 });

await page.goto(`${baseUrl}/admin/vendors/${vendorId}`, { waitUntil: "networkidle" });
await page.locator('input[name="events_completed"]').fill(newEventsCompleted);
await page.getByRole("button", { name: "Save profile" }).click();
await page.waitForTimeout(1500);
console.log(`Admin: set events_completed=${newEventsCompleted}`);

// Fresh, uncached navigation straight to the public discover page.
const publicPage = await browser.newPage();
await publicPage.goto(`${baseUrl}/discover`, { waitUntil: "networkidle" });
const discoverHtml = await publicPage.content();
const discoverHasNewValue = discoverHtml.includes(`${newEventsCompleted} events completed`);
console.log("Discover page shows updated events_completed?", discoverHasNewValue);

// Confirm the fallback avatar (logo, since this vendor has no owner photo) renders.
const cardImages = await publicPage.locator("img[alt='']").all();
console.log(`Discover page image count (cover + avatar images): ${cardImages.length}`);

const vendorProfilePage = await browser.newPage();
await vendorProfilePage.goto(
  `${baseUrl}/vendors/tawalogy-by-shriji-rasoi-pure-veg-restaurant-catering-services`,
  { waitUntil: "networkidle" }
);
const logoVisible = await vendorProfilePage.locator('img[alt="Tawalogy by Shriji Rasoi logo"]').isVisible();
console.log("Vendor profile header shows logo?", logoVisible);

await browser.close();
