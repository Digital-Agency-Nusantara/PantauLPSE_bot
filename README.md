# PantauLPSE Bot

Bot Telegram untuk memantau tender LPSE (Layanan Pengadaan Secara Elektronik) berdasarkan KBLI dan kata kunci.

## Struktur Kode

Kode telah diorganisir dalam struktur modular untuk memudahkan pemeliharaan dan pengembangan:

```
PantauLPSE_bot/
├── config/
│   └── config.js           # Konfigurasi bot
├── handlers/
│   ├── callbackHandlers.js # Handler untuk callback query
│   ├── commandHandlers.js  # Handler untuk perintah bot
│   ├── kbliHandler.js      # Handler untuk manajemen KBLI
│   ├── keywordHandler.js   # Handler untuk manajemen kata kunci
│   ├── messageHandlers.js  # Handler untuk pesan teks
│   └── settingsHandler.js  # Handler untuk pengaturan
├── services/
│   ├── monitoringService.js # Layanan pemantauan tender
│   ├── notificationService.js # Layanan notifikasi
│   └── scraper.js          # Layanan scraping data tender
├── utils/
│   ├── dataManager.js      # Manajemen data pengguna
│   ├── keyboards.js        # Keyboard Telegram
│   └── userStateManager.js # Manajemen state pengguna
├── bot.js                  # Versi lama (tidak digunakan)
├── old-bot.js              # Versi lama (tidak digunakan)
├── index.js                # File utama (entry point)
├── bot_users.json          # Data pengguna
└── links.txt               # Daftar URL LPSE
```

## Fitur

- Registrasi dan manajemen pengguna
- Manajemen KBLI (Klasifikasi Baku Lapangan Usaha Indonesia)
- Manajemen kata kunci (keywords)
- Pemantauan tender secara real-time
- Notifikasi tender yang sesuai dengan KBLI atau kata kunci
- Pengaturan konfigurasi (include/exclude non-tender, status aktif/nonaktif)

## Cara Menjalankan

1. Pastikan Node.js sudah terinstal di sistem Anda
2. Install dependensi:
   ```
   npm install
   ```
3. Jalankan bot:
   ```
   node index.js
   ```

## Penggunaan

1. Mulai chat dengan bot menggunakan perintah `/start`
2. Daftar dengan memasukkan nama Anda
3. Tambahkan KBLI dan kata kunci yang ingin dipantau
4. Mulai pemantauan dengan menu "Start Monitoring"
5. Bot akan mengirimkan notifikasi jika ada tender yang sesuai dengan KBLI atau kata kunci Anda

## Konfigurasi

Konfigurasi bot dapat diubah di file `config/config.js`:

- `BOT_TOKEN`: Token bot Telegram
- `USERS_FILE`: File untuk menyimpan data pengguna
- `LINKS_FILE`: File yang berisi daftar URL LPSE
- `ADMIN_IDS`: Daftar ID admin
- `SCRAPING_INTERVAL`: Interval pemantauan (dalam milidetik)
- `URL_DELAY`: Delay antara pemantauan URL (dalam milidetik)
- `REQUEST_DELAY`: Delay antara request HTTP (dalam milidetik)
- `ERROR_DELAY`: Delay jika terjadi error (dalam milidetik)
- `USER_AGENT`: User agent untuk scraping

## Perintah Admin

- `/admin_stats`: Menampilkan statistik bot
- `/admin_broadcast [pesan]`: Mengirim pesan broadcast ke semua pengguna
