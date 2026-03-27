const INCOME_KEYWORDS = ["gaji", "salary", "income", "bonus", "masuk"];
const EXPENSE_KEYWORDS = ["keluar", "expense", "spent", "bayar"];

function normalizeAmount(raw) {
  const cleaned = raw.toLowerCase().replace(/\s+/g, "");

  if (!cleaned) {
    return null;
  }

  let multiplier = 1;
  let digits = cleaned;

  if (digits.endsWith("rb")) {
    multiplier = 1000;
    digits = digits.slice(0, -2);
  } else if (digits.endsWith("k")) {
    multiplier = 1000;
    digits = digits.slice(0, -1);
  } else if (digits.endsWith("jt")) {
    multiplier = 1000000;
    digits = digits.slice(0, -2);
  }

  digits = digits.replace(/[.,](?=\d{3}\b)/g, "");
  digits = digits.replace(",", ".");

  const amount = Number(digits);

  if (Number.isNaN(amount)) {
    return null;
  }

  return Math.round(amount * multiplier);
}

function detectType(category, rawText) {
  const categoryText = `${category} ${rawText}`.toLowerCase();

  if (INCOME_KEYWORDS.some((keyword) => categoryText.includes(keyword))) {
    return "income";
  }

  if (EXPENSE_KEYWORDS.some((keyword) => categoryText.includes(keyword))) {
    return "expense";
  }

  return "expense";
}

function parseTransactionMessage(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim().replace(/\s+/g, " ");
  const amountMatch = trimmed.match(/(\d[\d.,]*\s*(?:rb|jt|k)?)/i);

  if (!amountMatch) {
    return null;
  }

  const amount = normalizeAmount(amountMatch[1]);

  if (!amount || amount <= 0) {
    return null;
  }

  const [beforeAmount, afterAmount] = trimmed.split(amountMatch[1], 2);
  const category = beforeAmount.trim().toLowerCase();
  const note = afterAmount ? afterAmount.trim() : "";

  if (!category) {
    return null;
  }

  return {
    rawText: trimmed,
    type: detectType(category, trimmed),
    category,
    amount,
    note,
  };
}

module.exports = {
  parseTransactionMessage,
};
