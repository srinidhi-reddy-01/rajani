import { chromium } from "playwright";

const url = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: "networkidle" });

const btn = page.getByRole("button", { name: "Check availability" });
await btn.waitFor({ state: "visible" });
const disabled = await btn.isDisabled();
console.log("Check availability disabled?", disabled);

const pickTexts = await page.locator("text=/Pick \\d+ · \\d+ selected/").allTextContents();
console.log("Slot counts:", pickTexts);

await browser.close();
