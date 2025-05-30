// handlers/commandHandlers.js
const config = require('../config/config');

class CommandHandlers {
  constructor(bot, dataManager, keyboards, userStateManager, monitoringService) {
    this.bot = bot;
    this.dataManager = dataManager;
    this.keyboards = keyboards;
    this.userStateManager = userStateManager;
    this.monitoringService = monitoringService;
  }

  // Handle /start command
  handleStart(msg) {
    const chatId = msg.chat.id;
    
    if (!this.dataManager.isUserRegistered(chatId)) {
      // Kirim pesan sambutan
      this.bot.sendMessage(chatId, 
        `🎉 Selamat datang di LPSE Tender Monitor Bot!\n\n` +
        `🤖 Saya adalah asisten pintar yang akan membantu Anda memantau tender/pengadaan pemerintah secara otomatis 24/7!\n\n` +
        `✨ KEUNGGULAN BOT INI:\n` +
        `🔍 Monitor ratusan website LPSE secara bersamaan\n` +
        `⚡ Notifikasi real-time tender yang sesuai kriteria Anda\n` +
        `📊 Filter berdasarkan KBLI & kata kunci spesifik\n` +
        `💰 Informasi lengkap: HPS, deadline, jenis pengadaan\n` +
        `🎯 Tidak akan melewatkan tender yang relevan lagi!\n\n` +
        `📋 YANG PERLU ANDA SIAPKAN:\n` +
        `- Kode KBLI usaha Anda\n` +
        `- Kata kunci bidang pekerjaan\n\n` +
        `🆘 BUTUH BANTUAN?\n` +
        `📞 Hubungi Admin: @sddq27\n` +
        `💬 Klik /help untuk panduan lengkap\n` +
        `📱 Customer Service: wa.me/6288286783842`
      );
      
      // Kirim pesan permintaan nama secara terpisah
      setTimeout(() => {
        this.bot.sendMessage(chatId, `Mari mulai! Ketik nama Anda untuk registrasi:`);
        this.userStateManager.setState(chatId, 'awaiting_registration');
      }, 1000); // Delay 1 detik untuk memisahkan pesan
    } else {
      const user = this.dataManager.getUser(chatId);
      const stats = this.monitoringService ? this.monitoringService.getStatus() : { isActive: false };
      
      this.bot.sendMessage(chatId, 
        `🏠 Selamat datang kembali, ${user.name}!\n\n` +
        `🎯 RINGKASAN AKUN ANDA:\n` +
        `📊 KBLI Terdaftar: ${user.kbliList.length} kode\n` +
        `🔍 Kata Kunci Aktif: ${user.keywords.length} kata kunci\n` +
        `🌐 URL LPSE: ${this.dataManager.loadUrlsFromFile().length} website\n` +
        `📢 Total Notifikasi: ${user.sentTenders.length} tender\n` +
        `🤖 Status Monitoring: ${stats.isActive ? '🟢 AKTIF' : '🔴 NONAKTIF'}\n\n` +
        `🆘 BUTUH BANTUAN?\n` +
        `📞 Admin: ${config.ADMIN_TELE}\n` +
        `💬 Panduan: /help\n` +
        `📱 CS Whatsapp: ${config.ADMIN_WA}\n\n` +
        `Pilih menu di bawah untuk mulai:`,
        this.keyboards.getMainMenuKeyboard(chatId)
      );
    }
  }

  // Handle /admin_stats command
  handleAdminStats(msg) {
    const chatId = msg.chat.id;
    
    if (!config.ADMIN_IDS.includes(chatId.toString())) {
      this.bot.sendMessage(chatId, '❌ Unauthorized');
      return;
    }
    
    const stats = this.dataManager.getStats();
    
    const message = `📊 ADMIN STATISTICS\n\n` +
                   `👥 Total Users: ${stats.totalUsers}\n` +
                   `✅ Active Users: ${stats.activeUsers}\n` +
                   `🤖 Monitoring Status: ${stats.isActive ? '🟢 Active' : '🔴 Inactive'}\n` +
                   `📢 Total Notifications Sent: ${stats.totalNotifications}\n` +
                   `📊 Total KBLI Entries: ${stats.totalKbli}\n` +
                   `🔍 Total Kata Kunci: ${stats.totalKeywords}\n` +
                   `🌐 Total URLs: ${stats.totalUrls}\n` +
                   `💾 Bot Uptime: ${process.uptime().toFixed(0)}s`;
    
    this.bot.sendMessage(chatId, message);
  }

  // Handle /help command
  handleHelp(msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `📚 PANDUAN PENGGUNAAN BOT LPSE TENDER MONITOR 📚

` +
      `🔹 CARA REGISTRASI:
` +
      `1. Ketik /start
` +
      `2. Masukkan nama Anda
` +
      `3. Anda akan mendapatkan akses ke menu utama

` +
      `🔹 MENAMBAHKAN KBLI:
` +
      `1. Pilih menu "📊 Daftar KBLI"
` +
      `2. Anda akan melihat daftar KBLI yang tersedia
` +
      `3. Pilih KBLI yang sesuai dengan bidang usaha Anda (contoh: 41001)
` +
      `4. KBLI akan ditambahkan ke daftar pemantauan Anda

` +
      `🔹 MENAMBAHKAN KATA KUNCI:
` +
      `1. Pilih menu "🔍 Kata Kunci"
` +
      `2. Pilih "➕ Tambah Kata Kunci"
` +
      `3. Masukkan kata kunci (contoh: konstruksi)

` +
      `🔹 PENGATURAN:
` +
      `1. Pilih menu "⚙️ Pengaturan"
` +
      `2. Anda dapat mengatur:
` +
      `   - Include/exclude non-tender
` +
      `   - Aktif/nonaktifkan akun

` +
      `🔹 MELIHAT STATUS:
` +
      `1. Pilih menu "📈 Status"
` +
      `2. Anda akan melihat status monitoring dan data Anda

` +
      `🔹 MELIHAT PROFIL:
` +
      `1. Pilih menu "👤 Profil"
` +
      `2. Anda akan melihat informasi profil Anda

` +
      `🔹 BUTUH BANTUAN LEBIH LANJUT?
` +
      `📞 Hubungi Admin: ${config.ADMIN_TELE}\n` +
      `📱 Customer Service: ${config.ADMIN_WA}`;
    
    this.bot.sendMessage(chatId, helpMessage, this.keyboards.getMainMenuKeyboard(chatId));
  }

  // Handle /admin_broadcast command
  async handleAdminBroadcast(msg, match) {
    const chatId = msg.chat.id;
    const message = match[1];
    
    if (!config.ADMIN_IDS.includes(chatId.toString())) {
      this.bot.sendMessage(chatId, '❌ Unauthorized');
      return;
    }
    
    let sentCount = 0;
    const users = this.dataManager.getAllUsers();
    for (const userId of Object.keys(users)) {
      try {
        await this.bot.sendMessage(userId, `📢 BROADCAST MESSAGE:\n\n${message}`);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send broadcast to ${userId}:`, error);
      }
    }
    
    this.bot.sendMessage(chatId, `✅ Broadcast sent to ${sentCount} users`);
  }

  // Register all command handlers
  registerHandlers() {
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/admin_stats/, (msg) => this.handleAdminStats(msg));
    this.bot.onText(/\/admin_broadcast (.+)/, (msg, match) => this.handleAdminBroadcast(msg, match));
  }
}

module.exports = CommandHandlers;
