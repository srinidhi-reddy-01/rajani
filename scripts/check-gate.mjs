import { chromium } from "playwright";

const url = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: "networkidle" });

const checkBtn = page.getByRole("button", { name: "Check availability" });
console.log("Initially (all defaults) disabled?", await checkBtn.isDisabled());

// Deselect one item in a 2-pick slot without replacing it -> should become incomplete.
await page.getByRole("button", { name: /Paneer Tikka/ }).click();
console.log("After deselecting one item, disabled?", await checkBtn.isDisabled());

const pickTexts = await page.locator("text=/Pick \\d+ · \\d+ selected/").allTextContents();
console.log("Slot counts:", pickTexts);

await browser.close();
