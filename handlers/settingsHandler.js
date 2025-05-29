// handlers/settingsHandler.js

class SettingsHandler {
  constructor(bot, dataManager, keyboards) {
    this.bot = bot;
    this.dataManager = dataManager;
    this.keyboards = keyboards;
  }

  // Handle settings
  handleSettings(chatId) {
    const user = this.dataManager.getUser(chatId);
    const keyboard = this.keyboards.getSettingsKeyboard(user);
    
    const message = `⚙️ Pengaturan:\n\n` +
                   `Termasuk Non Tender: ${user.includeNonTender ? '✅ Ya' : '❌ Tidak'}\n` +
                   `Status Pengguna: ${user.isActive ? '✅ Aktif' : '❌ Nonaktif'}\n\n` +
                   `Klik tombol untuk mengubah pengaturan:`;
    
    this.bot.sendMessage(chatId, message, keyboard);
  }
}

module.exports = SettingsHandler;
