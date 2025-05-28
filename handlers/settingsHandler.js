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
    
    const message = `⚙️ Settings:\n\n` +
                   `Include Non Tender: ${user.includeNonTender ? '✅ Yes' : '❌ No'}\n` +
                   `User Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}\n\n` +
                   `Klik tombol untuk mengubah setting:`;
    
    this.bot.sendMessage(chatId, message, keyboard);
  }
}

module.exports = SettingsHandler;
