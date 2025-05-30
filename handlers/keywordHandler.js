// handlers/keywordHandler.js

class KeywordHandler {
  constructor(bot, dataManager, keyboards, userStateManager) {
    this.bot = bot;
    this.dataManager = dataManager;
    this.keyboards = keyboards;
    this.userStateManager = userStateManager;
  }

  // Handle Tambah Kata kunci
  handleAddKeyword(chatId, keywordInput) {
    // Split input by comma, trim spaces, filter empty
    const keywords = keywordInput.split(',').map(k => k.trim()).filter(k => k);
    let added = [];
    let already = [];
    for (const keyword of keywords) {
      if (this.dataManager.addKeyword(chatId, keyword)) {
        added.push(keyword);
      } else {
        already.push(keyword);
      }
    }
    let message = '';
    if (added.length > 0) {
      message += `✅ Keyword berikut berhasil ditambahkan: ${added.join(', ')}\n`;
    }
    if (already.length > 0) {
      message += `❌ Keyword sudah ada: ${already.join(', ')}\n`;
    }
    if (!message) message = 'Tidak ada keyword yang ditambahkan.';
    this.bot.sendMessage(chatId, message, this.keyboards.getKeywordsKeyboard());
    this.userStateManager.clearState(chatId);
  }

  // Handle Lihat Kata kuncis
  handleViewKeywords(chatId) {
    const user = this.dataManager.getUser(chatId);
    const keywords = user.keywords;
    
    if (keywords.length === 0) {
      this.bot.sendMessage(chatId, '🔍 Daftar keywords masih kosong.', this.keyboards.getKeywordsKeyboard());
    } else {
      const message = '🔍 Daftar Keywords Anda:\n\n' + keywords.map((keyword, index) => `${index + 1}. ${keyword}`).join('\n');
      this.bot.sendMessage(chatId, message, this.keyboards.getKeywordsKeyboard());
    }
  }

  // Handle Hapus Kata Kunci menu
  handleDeleteKeywordMenu(chatId) {
    const user = this.dataManager.getUser(chatId);
    const keywords = user.keywords;
    
    if (keywords.length === 0) {
      this.bot.sendMessage(chatId, '🔍 Daftar keywords masih kosong.', this.keyboards.getKeywordsKeyboard());
    } else {
      const message = '🗑️ Pilih nomor keyword yang akan dihapus:\n\n' + 
                     keywords.map((keyword, index) => `${index + 1}. ${keyword}`).join('\n') +
                     '\n\nKetik nomor urut (contoh: 1):';
      this.bot.sendMessage(chatId, message);
      this.userStateManager.setState(chatId, 'awaiting_delete_keyword');
    }
  }

  // Handle Hapus Kata Kunci
  handleDeleteKeyword(chatId, text) {
    const index = parseInt(text) - 1;
    const deletedKeyword = this.dataManager.removeKeyword(chatId, index);
    
    if (deletedKeyword) {
      this.bot.sendMessage(chatId, `✅ Keyword "${deletedKeyword}" berhasil dihapus!`, this.keyboards.getKeywordsKeyboard());
    } else {
      this.bot.sendMessage(chatId, '❌ Nomor tidak valid!', this.keyboards.getKeywordsKeyboard());
    }
    this.userStateManager.clearState(chatId);
  }
}

module.exports = KeywordHandler;
