# Money Tracker WhatsApp Bot

Bot ini membaca chat WhatsApp seperti:

- `makan 20000`
- `transport 15rb`
- `gaji 5000000`
- `kopi 18.500 nongkrong`

Lalu bot akan parse isi pesan dan menambahkan baris baru ke Google Sheets.

## Stack

- `whatsapp-web.js`
- `Express` untuk healthcheck Render
- `Google Sheets API`
- Deploy ke `Render`

## Format Pesan

Format paling aman:

```text
kategori jumlah catatan-opsional
```

Contoh:

```text
makan 20000
bensin 50rb motor
gaji 5jt kantor
```

## Struktur Spreadsheet

Bot akan membuat header ini di sheet:

```text
timestamp | date | time | type | category | amount | note | sender | raw_text
```

## Setup Local

1. Install dependency:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Buat Google Service Account lalu aktifkan Google Sheets API.

4. Share spreadsheet tujuan ke email service account kamu dengan akses Editor.

5. Isi `.env`:

```env
PORT=3000
APP_TIMEZONE=Asia/Jakarta
SPREADSHEET_ID=your_google_sheet_id
SHEET_NAME=Transactions
WHATSAPP_SESSION_NAME=money-tracker
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

6. Jalankan:

```bash
npm run dev
```

7. Scan QR yang muncul di terminal.

## Deploy ke Render

1. Push project ini ke GitHub.
2. Buat `Web Service` baru di Render dari repo tersebut.
3. Render akan membaca `render.yaml`.
4. Isi semua environment variable yang sama seperti file `.env`.
5. Deploy lalu buka log untuk scan QR.

Kalau deploy gagal karena Chrome tidak ditemukan, project ini sekarang sudah menjalankan:

```bash
npx puppeteer browsers install chrome
```

saat `npm install`. Jadi biasanya cukup `Clear build cache & deploy` sekali dari Render supaya binary Chrome ikut terpasang.

Render juga dikunci ke Node 20 lewat `render.yaml`, karena log error kamu tadi menunjukkan Node `v25.8.2` dan itu terlalu baru untuk banyak paket bot dan Puppeteer.

## Catatan Penting Render Free

`whatsapp-web.js` butuh sesi login WhatsApp. Di Render free, filesystem tidak persisten antar redeploy atau restart besar, jadi ada kemungkinan kamu perlu scan QR lagi. Untuk MVP ini masih oke, tapi kalau mau stabil jangka panjang biasanya perlu penyimpanan session yang persisten di luar container.
