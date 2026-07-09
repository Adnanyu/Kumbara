import type { Category } from "./types";

// Ordered keyword rules — first match wins. Keys are lowercase substrings
// matched against the transaction description/merchant text.
const RULES: Array<[Category, string[]]> = [
  [
    "Income",
    ["payroll", "direct dep", "salary", "paycheck", "employer", "interest paid", "dividend", "venmo cashout", "refund"],
  ],
  [
    "Subscriptions",
    ["netflix", "spotify", "hulu", "disney+", "apple.com/bill", "youtube premium", "audible", "patreon", "adobe", "icloud", "dropbox", "playstation network", "xbox live", "prime video", "hbo max", "paramount+"],
  ],
  ["Insurance", ["insurance", "geico", "progressive", "state farm", "allstate", "metlife", "liberty mutual", "usaa"]],
  ["Gaming", ["steam", "playstation store", "nintendo", "xbox", "epic games", "riot games", "twitch", "roblox", "blizzard"]],
  ["Beauty", ["sephora", "ulta", "salon", "spa", "nail", "barber", "beauty", "cosmetic"]],
  ["Gas", ["shell", "chevron", "exxon", "mobil", "bp #", "gas station", "sunoco", "marathon petro", "circle k fuel", "76 "]],
  [
    "Grocery",
    ["grocery", "whole foods", "trader joe", "safeway", "kroger", "walmart supercenter", "aldi", "publix", "costco whse", "sprouts", "harris teeter", "wegmans", "giant food"],
  ],
  [
    "Dining",
    ["restaurant", "starbucks", "chipotle", "mcdonald", "doordash", "grubhub", "uber eats", "cafe", "coffee", "pizza", "sushi", "bar & grill", "taco"],
  ],
  ["Transport", ["uber", "lyft", "metro", "transit", "parking", "toll", "amtrak", "delta air", "united air", "southwest air"]],
  ["Utilities", ["electric", "water bill", "gas bill", "utility", "pepco", "comcast", "xfinity", "verizon", "at&t", "t-mobile", "internet service"]],
  ["Health", ["pharmacy", "cvs", "walgreens", "clinic", "medical", "dental", "urgent care", "hospital", "doctor"]],
  ["Entertainment", ["movie", "cinema", "amc", "concert", "ticketmaster", "museum", "amusement", "bowling"]],
  ["Housing", ["rent", "mortgage", "landlord", "property mgmt", "hoa fee"]],
  ["Shopping", ["amazon", "target", "best buy", "ebay", "etsy", "macy", "nordstrom", "ikea", "home depot", "lowe's", "shopping"]],
];

export function categorizeTransaction(description: string): Category {
  const text = description.toLowerCase();
  for (const [category, keywords] of RULES) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

export function extractMerchant(description: string): string {
  // Strip common noise (card auth codes, dates, trailing location refs)
  let m = description
    .replace(/\s{2,}/g, " ")
    .replace(/#\d+/g, "")
    .replace(/\b\d{4,}\b/g, "")
    .replace(/(pos|debit|credit|purchase|payment|authorized on \d+\/\d+)/gi, "")
    .trim();
  m = m.split(/\s{2,}| - /)[0].trim();
  return m.length > 2 ? m : description.trim();
}
