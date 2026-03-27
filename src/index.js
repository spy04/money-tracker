const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { appendTransaction } = require("./sheets");
const { parseTransactionMessage } = require("./parser");
const { port, whatsappSessionName } = require("./config");

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "money-tracker-wa-bot",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: whatsappSessionName }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("loading_screen", (percent, message) => {
  console.log(`WhatsApp loading: ${percent}% - ${message}`);
});

client.on("qr", (qr) => {
  console.log("Scan QR berikut di WhatsApp:");
  qrcode.generate(qr, { small: true });
  console.log("QR raw:", qr);
  console.log(
    "QR image URL:",
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`
  );
});

client.on("ready", () => {
  console.log("WhatsApp bot sudah siap.");
});

client.on("authenticated", () => {
  console.log("WhatsApp authenticated.");
});

client.on("auth_failure", (message) => {
  console.error("WhatsApp auth failure:", message);
});

client.on("disconnected", (reason) => {
  console.error("WhatsApp disconnected:", reason);
});

client.on("message_create", (message) => {
  console.log(`Message observed from ${message.from}: ${message.body}`);
});

client.on("message", async (message) => {
  if (message.fromMe) {
    return;
  }

  const transaction = parseTransactionMessage(message.body);

  if (!transaction) {
    return;
  }

  try {
    await appendTransaction(transaction, message.from);

    const reply = [
      "Tersimpan ke spreadsheet.",
      `Kategori: ${transaction.category}`,
      `Jumlah: Rp${transaction.amount.toLocaleString("id-ID")}`,
      `Tipe: ${transaction.type}`,
    ].join("\n");

    await message.reply(reply);
  } catch (error) {
    console.error("Failed to append transaction:", error);
    await message.reply(
      "Pesan kebaca, tapi gagal simpan ke spreadsheet. Cek konfigurasi Google Sheets di server ya."
    );
  }
});

console.log("Initializing WhatsApp client...");
client.initialize().catch((error) => {
  console.error("WhatsApp initialize error:", error);
});
