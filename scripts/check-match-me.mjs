import { chromium } from "playwright";

const phone = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

await page.getByPlaceholder("10-digit mobile number").fill(phone);
await page.getByRole("button", { name: "Match me with caterers" }).click();
await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
console.log("Match request submitted from landing page");

await browser.close();
