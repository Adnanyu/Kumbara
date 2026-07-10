import type { Category, Transaction } from "./types";

// Ordered keyword rules — first match wins. Keys are lowercase substrings
// matched against a *normalized* transaction description (see
// normalizeForMatching below). This list intentionally errs toward broad
// coverage of real-world statement text (abbreviations, POS codes, common
// chains) rather than a handful of obvious brand names — the single
// biggest cause of everything landing in "Other" is normal bank
// shorthand ("AMZN Mktp", "SQ *", "TST*", "WM SUPERCENTER") not matching a
// narrow keyword list.
const RULES: Array<[Category, string[]]> = [
  [
    "Income",
    [
      "payroll",
      "direct dep",
      "salary",
      "paycheck",
      "employer",
      "interest paid",
      "dividend",
      "venmo cashout",
      "refund",
      "reimbursement",
      "tax refund",
      "irs treas",
    ],
  ],
  [
    "Transfers",
    [
      "zelle",
      "venmo",
      "cash app",
      "cashapp",
      "paypal transfer",
      "atm withdrawal",
      "atm w/d",
      "wire transfer",
      "ach transfer",
      "account transfer",
      "external transfer",
      "p2p payment",
      "money transfer",
    ],
  ],
  [
    "Subscriptions",
    [
      "netflix",
      "hulu",
      "disney+",
      "disney plus",
      "max.com",
      "hbo max",
      "paramount+",
      "peacock",
      "apple.com/bill",
      "youtube premium",
      "youtube tv",
      "audible",
      "patreon",
      "adobe",
      "icloud",
      "dropbox",
      "microsoft 365",
      "office 365",
      "playstation network",
      "xbox live",
      "prime video",
      "amazon prime",
      "spotify",
      "apple music",
      "nyt",
      "nytimes",
      "wsj",
      "substack",
      "onlyfans",
      "peloton",
      "planet fitness",
      "la fitness",
      "equinox",
      "gym membership",
    ],
  ],
  ["Insurance", ["insurance", "geico", "progressive", "state farm", "allstate", "metlife", "liberty mutual", "usaa", "nationwide ins"]],
  ["Gaming", ["steam", "playstation store", "psn", "nintendo", "xbox", "epic games", "riot games", "twitch", "roblox", "blizzard", "ea.com", "valve"]],
  ["Beauty", ["sephora", "ulta", "salon", "spa ", "nail", "barber", "beauty", "cosmetic", "skincare"]],
  ["Gas", ["shell", "chevron", "exxon", "mobil", "bp#", "bp #", "gas station", "sunoco", "marathon petro", "circle k", "76 gas", "speedway", "wawa", "sheetz", "costco gas", "valero", "phillips 66", "conoco", "casey's"]],
  [
    "Grocery",
    [
      "grocery",
      "whole foods",
      "trader joe",
      "safeway",
      "kroger",
      "walmart supercenter",
      "wm supercenter",
      "aldi",
      "publix",
      "costco whse",
      "costco wholesale",
      "sprouts",
      "harris teeter",
      "wegmans",
      "giant food",
      "food lion",
      "stop & shop",
      "h-e-b",
      "meijer",
      "vons",
      "albertsons",
      "instacart",
    ],
  ],
  [
    "Dining",
    [
      "restaurant",
      "starbucks",
      "dunkin",
      "peet's",
      "chipotle",
      "mcdonald",
      "wendy's",
      "burger king",
      "subway",
      "domino's",
      "dominos",
      "pizza hut",
      "kfc",
      "taco bell",
      "panera",
      "chick-fil-a",
      "chickfila",
      "five guys",
      "panda express",
      "shake shack",
      "in-n-out",
      "sweetgreen",
      "cava",
      "doordash",
      "grubhub",
      "uber eats",
      "postmates",
      "cafe",
      "coffee",
      "pizza",
      "sushi",
      "bar & grill",
      "taco",
      "canteen",
      "bakery",
      "deli",
      "brewery",
      "diner",
    ],
  ],
  [
    "Transport",
    [
      "uber",
      "lyft",
      "metro",
      "transit",
      "parking",
      "toll",
      "amtrak",
      "delta air",
      "united air",
      "southwest air",
      "jetblue",
      "alaska air",
      "spirit air",
      "frontier air",
      "hertz",
      "avis",
      "enterprise rent",
      "budget rent",
      "airline",
      "smartrip",
      "septa",
      "mta ",
      "bart ",
    ],
  ],
  [
    "Utilities",
    [
      "electric",
      "water bill",
      "gas bill",
      "utility",
      "utilities",
      "pepco",
      "comcast",
      "xfinity",
      "verizon",
      "at&t",
      "att*",
      "t-mobile",
      "tmobile",
      "internet service",
      "spectrum",
      "pg&e",
      "coned",
      "con edison",
      "duke energy",
      "national grid",
      "waste management",
      "trash collection",
      "sewer",
      "laundry",
    ],
  ],
  [
    "Health",
    [
      "pharmacy",
      "cvs",
      "walgreens",
      "rite aid",
      "clinic",
      "medical",
      "dental",
      "urgent care",
      "hospital",
      "doctor",
      "kaiser",
      "labcorp",
      "quest diagnostics",
      "optometry",
      "orthodontic",
      "physical therapy",
      "chiropractic",
    ],
  ],
  ["Entertainment", ["movie", "cinema", "amc", "regal cinema", "cinemark", "concert", "ticketmaster", "museum", "amusement", "bowling", "six flags", "live nation"]],
  ["Housing", ["rent", "mortgage", "landlord", "property mgmt", "property management", "hoa fee", "apartments", "realty"]],
  [
    "Shopping",
    [
      "amazon",
      "amzn",
      "target",
      "tgt*",
      "best buy",
      "ebay",
      "etsy",
      "macy",
      "nordstrom",
      "ikea",
      "home depot",
      "lowe's",
      "lowes",
      "wal-mart",
      "walmart",
      "wm supercenter",
      "marshalls",
      "tj maxx",
      "tjmaxx",
      "ross stores",
      "kohl's",
      "kohls",
      "gap",
      "old navy",
      "h&m",
      "zara",
      "nike",
      "adidas",
      "bershka",
      "shein",
      "wayfair",
      "michaels",
      "staples",
      "office depot",
      "shopping",
    ],
  ],
];

// Strips common POS/processor boilerplate that otherwise breaks keyword
// matching, e.g. "SQ *ANDY'S PIZZA" -> "ANDY'S PIZZA", "TST* CAVA" -> "CAVA".
function normalizeForMatching(description: string): string {
  return description
    .toLowerCase()
    .replace(/^(sq|tst|py|pp|ip)\s*\*\s*/i, "")
    .replace(/^(pos|ach|ppd|web|des|indn)[\s:*-]+/i, "")
    .replace(/card purchase( with pin)?/gi, "")
    .replace(/authorized on \d{1,2}\/\d{1,2}/gi, "")
    .trim();
}

export function categorizeTransaction(description: string): Category {
  const text = normalizeForMatching(description);
  for (const [category, keywords] of RULES) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

export function extractMerchant(description: string): string {
  let m = description
    .replace(/\s{2,}/g, " ")
    // Strip common transaction-type prefixes banks prepend to the merchant name.
    .replace(/^(card purchase( with pin)?|atm withdrawal|zelle payment to|check paid|ach (debit|credit)|deposit)\s*/i, "")
    // Strip an embedded secondary date (e.g. the original purchase date vs. post date).
    .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, "")
    // Strip trailing card-network reference like "Card 0712".
    .replace(/\bcard\s*#?\d{3,4}\s*$/i, "")
    .replace(/#\d+/g, "")
    .replace(/\b\d{6,}\b/g, "")
    .replace(/(pos|debit|credit|purchase|payment|authorized on)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  m = m.split(/\s{2,}| - /)[0].trim();
  return m.length > 2 ? m : description.trim();
}

// Normalizes a merchant name into a stable lookup key so that minor
// formatting differences between statements/imports ("WHOLE FOODS #123" vs
// "Whole Foods Mkt") still resolve to the same learned merchant.
export function merchantKey(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/#\d+/g, "")
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds a merchant -> category lookup from the user's existing
 * transactions, so categorization gets smarter over time as they correct
 * mislabeled transactions or as more of their history gets imported. A
 * manually-corrected transaction (categoryOverridden) always outweighs an
 * auto-categorized one for the same merchant.
 */
export function buildLearnedCategoryMap(transactions: Transaction[]): Map<string, Category> {
  const votes = new Map<string, Map<Category, number>>();

  for (const t of transactions) {
    const key = merchantKey(t.merchant);
    if (!key) continue;
    if (!votes.has(key)) votes.set(key, new Map());
    const catVotes = votes.get(key)!;
    // Weight manual corrections heavily so a single fix "sticks" for that
    // merchant even if it was auto-categorized incorrectly many times before.
    const weight = t.categoryOverridden ? 5 : 1;
    catVotes.set(t.category, (catVotes.get(t.category) ?? 0) + weight);
  }

  const learned = new Map<string, Category>();
  for (const [key, catVotes] of votes.entries()) {
    let bestCategory: Category = "Other";
    let bestScore = -1;
    for (const [category, score] of catVotes.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    if (bestCategory !== "Other") learned.set(key, bestCategory);
  }
  return learned;
}

/**
 * Categorizes a transaction, preferring a category the user has already
 * confirmed (directly or by inference) for the same merchant over the
 * static keyword rules.
 */
export function categorizeWithMemory(
  description: string,
  merchant: string,
  learnedMap: Map<string, Category>
): Category {
  const learned = learnedMap.get(merchantKey(merchant));
  if (learned) return learned;
  return categorizeTransaction(description);
}