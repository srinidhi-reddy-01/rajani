import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const slug = process.argv[3] ?? "tawalogy-by-shriji-rasoi-pure-veg-restaurant-catering-services";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${baseUrl}/vendors/${slug}`, { waitUntil: "networkidle" });

await page.getByRole("button", { name: "Check availability" }).click();
const enquireDesc = await page.getByText("Every booking includes a dedicated event manager").isVisible();
console.log("Check availability modal shows dedicated event manager line?", enquireDesc);
await page.getByRole("button", { name: "Close" }).click();

await page.getByRole("button", { name: "Get sample box" }).click();
const tastingDesc = await page.getByText("Don't book blind — taste the actual menu before you decide.").isVisible();
console.log("Sample box modal echoes Taste pillar?", tastingDesc);

await browser.close();
