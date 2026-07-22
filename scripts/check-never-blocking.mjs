import { chromium } from "playwright";

const url = process.argv[2];
const phone = process.argv[3];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: "networkidle" });

const checkBtn = page.getByRole("button", { name: "Check availability" });
console.log("Disabled without ever opening the selector?", await checkBtn.isDisabled());

await checkBtn.click();
await page.getByPlaceholder("10-digit mobile number").fill(phone);
await page.getByRole("button", { name: "Submit" }).click();
await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
console.log("Submission confirmed with no menu customisation");

await browser.close();
