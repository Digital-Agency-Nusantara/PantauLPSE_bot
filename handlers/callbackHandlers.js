// handlers/callbackHandlers.js

class CallbackHandlers {
  constructor(bot, dataManager, settingsHandler) {
    this.bot = bot;
    this.dataManager = dataManager;
    this.settingsHandler = settingsHandler;
  }

  // Handle callback query
  handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    switch (data) {
      case 'toggle_non_tender':
        const user = this.dataManager.getUser(chatId);
        if (!user) {
          this.bot.answerCallbackQuery(callbackQuery.id, { 
            text: 'User tidak ditemukan.', 
            show_alert: true 
          });
          return;
        }
        
        // Update setting
        const newSetting = !user.includeNonTender;
        this.dataManager.updateUser(chatId, { includeNonTender: newSetting });
        
        // Update display
        this.settingsHandler.handleSettings(chatId);
        
        // Send feedback
        this.bot.answerCallbackQuery(callbackQuery.id, { 
          text: `Termasuk Non Tender: ${newSetting ? '✅ Yes' : '❌ No'}` 
        });
        break;
        
      case 'toggle_user_active':
        const userActive = this.dataManager.getUser(chatId);
        if (!userActive) {
          this.bot.answerCallbackQuery(callbackQuery.id, { 
            text: 'User tidak ditemukan.', 
            show_alert: true 
          });
          return;
        }
        
        // Check if user is expired before updating status
        const isExpired = this.dataManager.isUserExpired(chatId);
        if (isExpired && !userActive.isActive) {
          this.bot.answerCallbackQuery(callbackQuery.id, { 
            text: 'Masa aktif akun Anda telah berakhir. Silakan hubungi admin untuk perpanjangan.', 
            show_alert: true 
          });
          return;
        }
        
        // Update setting
        const newActiveStatus = !userActive.isActive;
        this.dataManager.updateUser(chatId, { isActive: newActiveStatus });
        
        // Update display
        this.settingsHandler.handleSettings(chatId);
        
        // Send feedback
        this.bot.answerCallbackQuery(callbackQuery.id, { 
          text: `User Status: ${newActiveStatus ? '✅ Active' : '❌ Inactive'}` 
        });
        break;
    }
  }

  // Register callback handler
  registerHandler() {
    this.bot.on('callback_query', (callbackQuery) => this.handleCallbackQuery(callbackQuery));
  }
}

module.exports = CallbackHandlers;
