import { chromium } from "playwright";

const url = process.argv[2];
const phone = process.argv[3];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: "networkidle" });

// Swap: deselect the currently-selected default in "Starters veg", pick "Veg Manchurian" instead.
// (Dish names also appear in the read-only Menu list below, so scope to the selector's buttons.)
await page.getByRole("button", { name: /Paneer Tikka/ }).click();
await page.getByRole("button", { name: /Veg Manchurian/ }).click();

const pickTexts = await page.locator("text=/Pick \\d+ · \\d+ selected/").allTextContents();
console.log("Slot counts after swap:", pickTexts);

const checkBtn = page.getByRole("button", { name: "Check availability" });
const disabledAfterSwap = await checkBtn.isDisabled();
console.log("Check availability disabled after swap?", disabledAfterSwap);
await checkBtn.click();

await page.getByPlaceholder("10-digit mobile number").fill(phone);
await page.getByRole("button", { name: "Submit" }).click();
await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
console.log("Submission confirmed in UI");

await browser.close();
