const { google } = require("googleapis");
const {
  serviceAccountCredentials,
  spreadsheetId,
  sheetName,
  timezone,
} = require("./config");

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountCredentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetsClient() {
  const authClient = await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: authClient,
  });
}

function getTimestampParts() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const map = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  const date = `${map.year}-${map.month}-${map.day}`;
  const time = `${map.hour}:${map.minute}:${map.second}`;

  return {
    timestamp: `${date} ${time}`,
    date,
    time,
  };
}

async function ensureHeaders() {
  const sheets = await getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });
  const sheetExists = (spreadsheet.data.sheets || []).some(
    (sheet) => sheet.properties && sheet.properties.title === sheetName
  );

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
  }

  const range = `${sheetName}!A1:I1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  if (existing.data.values && existing.data.values.length > 0) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        "timestamp",
        "date",
        "time",
        "type",
        "category",
        "amount",
        "note",
        "sender",
        "raw_text",
      ]],
    },
  });
}

async function appendTransaction(transaction, sender) {
  if (!spreadsheetId) {
    throw new Error("SPREADSHEET_ID is missing.");
  }

  await ensureHeaders();

  const sheets = await getSheetsClient();
  const now = getTimestampParts();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:I`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        now.timestamp,
        now.date,
        now.time,
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.note,
        sender,
        transaction.rawText,
      ]],
    },
  });
}

module.exports = {
  appendTransaction,
};
