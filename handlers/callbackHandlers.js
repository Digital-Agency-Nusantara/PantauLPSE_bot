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
        this.dataManager.updateUser(chatId, { includeNonTender: !user.includeNonTender });
        this.settingsHandler.handleSettings(chatId);
        this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Setting updated!' });
        break;
        
      case 'toggle_user_active':
        const userActive = this.dataManager.getUser(chatId);
        this.dataManager.updateUser(chatId, { isActive: !userActive.isActive });
        this.settingsHandler.handleSettings(chatId);
        this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Setting updated!' });
        break;
    }
  }

  // Register callback handler
  registerHandler() {
    this.bot.on('callback_query', (callbackQuery) => this.handleCallbackQuery(callbackQuery));
  }
}

module.exports = CallbackHandlers;
