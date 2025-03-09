const TelegramBot = require('node-telegram-bot-api');

// Ganti dengan token bot Anda
const token = '7877072782:AAFLVX3OqgLsSc4CKTpFHPPm7gxTm23RcOY';

// Buat instance bot
const bot = new TelegramBot(token, { polling: true });

// Tangani perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userInfo = `
    👤 User Info:
    - Nama: ${msg.from.first_name} ${msg.from.last_name || ''}
    - Username: @${msg.from.username || 'Tidak ada'}
    - ID: ${msg.from.id}
    - Bahasa: ${msg.from.language_code}
  `;

  // Kirim user info ke pengguna
  bot.sendMessage(chatId, userInfo);
});

console.log('Bot sedang berjalan...');