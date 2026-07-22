import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const vendorSlug = process.argv[3] ?? "annapurna-caterers-demo";
const packageName = process.argv[4] ?? "Classic Wedding Package";

const browser = await chromium.launch();

// 1. Enquiry — "Check availability"
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseUrl}/vendors/${vendorSlug}`, { waitUntil: "networkidle" });
  await page.getByText(packageName, { exact: false }).first().click();
  await page.getByRole("button", { name: "Check availability" }).click();
  await page.getByPlaceholder("10-digit mobile number").fill("9111000001");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
  console.log("[Enquiry] submitted");
  await page.close();
}

// 2. Tasting / sample box request
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseUrl}/vendors/${vendorSlug}`, { waitUntil: "networkidle" });
  await page.getByText(packageName, { exact: false }).first().click();
  await page.getByRole("button", { name: "Get sample box" }).click();
  await page.getByPlaceholder("10-digit mobile number").fill("9111000002");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
  console.log("[Tasting request] submitted");
  await page.close();
}

// 3. Match request — landing page "Too busy to browse?"
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByPlaceholder("10-digit mobile number").fill("9111000003");
  await page.getByRole("button", { name: "Match me with caterers" }).click();
  await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
  console.log("[Match request] submitted");
  await page.close();
}

await browser.close();
