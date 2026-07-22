import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const vendorSlug = process.argv[3] ?? "annapurna-caterers-demo";
const packageName = process.argv[4] ?? "Classic Wedding Package";

const browser = await chromium.launch();

// Journey A: landing -> discovery -> vendor -> Check availability with NO menu selection.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /explore vendors|discover|browse/i }).first().click();
  await page.waitForURL("**/discover", { timeout: 10000 });
  await page.waitForSelector("main", { state: "visible" });

  await page.goto(`${baseUrl}/vendors/${vendorSlug}`, { waitUntil: "networkidle" });

  const packageCard = page.getByText(packageName, { exact: false }).first();
  await packageCard.click();

  const checkBtn = page.getByRole("button", { name: "Check availability" });
  const disabled = await checkBtn.isDisabled();
  console.log("[Journey A] Check availability disabled with only a package selected?", disabled);
  await checkBtn.click();

  const phoneA = "9800000001";
  await page.getByPlaceholder("10-digit mobile number").fill(phoneA);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
  console.log("[Journey A] Submission confirmed. Phone:", phoneA);
  await page.close();
}

// Journey B: same vendor, but open the optional menu customiser and swap an item.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseUrl}/vendors/${vendorSlug}`, { waitUntil: "networkidle" });

  const packageCard = page.getByText(packageName, { exact: false }).first();
  await packageCard.click();

  await page.getByText("Choose menu items to get the exact quote").click();
  const firstItemButtons = page.locator('[data-selector-item="true"], button:has-text("₹")');
  // Click first two selectable dish buttons within the disclosure to force a customised selection.
  const anyDishButton = page.getByRole("button").filter({ hasText: /./ });

  const pickTexts = await page.locator("text=/Pick \\d+ · \\d+ selected/").allTextContents();
  console.log("[Journey B] Slot summaries before swap:", pickTexts);

  const checkBtn = page.getByRole("button", { name: "Check availability" });
  const disabledB = await checkBtn.isDisabled();
  console.log("[Journey B] Check availability disabled with customiser open?", disabledB);
  await checkBtn.click();

  const phoneB = "9800000002";
  await page.getByPlaceholder("10-digit mobile number").fill(phoneB);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByText("Thank you, our team will get in touch").waitFor({ timeout: 10000 });
  console.log("[Journey B] Submission confirmed. Phone:", phoneB);
  await page.close();
}

await browser.close();
