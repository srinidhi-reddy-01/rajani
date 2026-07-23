import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const slug = process.argv[3] ?? "tawalogy-by-shriji-rasoi-pure-veg-restaurant-catering-services";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${baseUrl}/vendors/${slug}`, { waitUntil: "networkidle" });

// Select the Grand Package (has a pick-1 Welcome drinks slot and pick-3 Starters slot).
await page.getByText("Grand Package", { exact: false }).first().click();
await page.getByText("Choose menu items to get the exact quote").click();

// Pick-1 slot: Welcome drinks. Click a non-default item; the previous default should
// auto-deselect (radio behavior), without ever going over 1 selected.
const welcomeSection = page.locator("div", { has: page.getByText("Welcome drinks", { exact: true }) }).first();
console.log("Welcome drinks counter before:", await page.getByText(/Pick 1 · \d selected/).first().textContent());
await page.getByRole("button", { name: /Jaljeera/ }).click();
console.log("Welcome drinks counter after clicking Jaljeera:", await page.getByText(/Pick 1 · \d selected/).first().textContent());
const jaljeeraPressed = await page.getByRole("button", { name: /Jaljeera/ }).getAttribute("aria-pressed");
const mojitoPressed = await page.getByRole("button", { name: /Mojito/ }).getAttribute("aria-pressed");
console.log("Jaljeera aria-pressed:", jaljeeraPressed, "| Mojito aria-pressed:", mojitoPressed);

// Pick-3 slot: Starters. Fill to capacity with the 3 defaults, then click a 4th new
// item - the oldest (first-picked) should drop out (FIFO), staying at exactly 3.
const startersCounterBefore = await page.getByText(/Pick 3 · \d selected/).first().textContent();
console.log("Starters counter before:", startersCounterBefore);
// Find which item is NOT currently selected among Starters options.
const starterButtons = await page.getByRole("button", { name: /Kebab|Mini Samosa|Veg Manchurian|Noodles/ }).all();
for (const btn of starterButtons) {
  const name = await btn.textContent();
  const pressed = await btn.getAttribute("aria-pressed");
  console.log(`  starter option: ${name?.trim()} pressed=${pressed}`);
}
const unselected = page.getByRole("button", { name: "Noodles" });
const unselectedPressedBefore = await unselected.getAttribute("aria-pressed");
console.log("Noodles pressed before click:", unselectedPressedBefore);
await unselected.click();
console.log("Starters counter after clicking Noodles:", await page.getByText(/Pick 3 · \d selected/).first().textContent());
const noodlesPressed = await unselected.getAttribute("aria-pressed");
console.log("Noodles pressed after click:", noodlesPressed);

await browser.close();
