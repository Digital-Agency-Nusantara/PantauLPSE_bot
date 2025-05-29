// handlers/kbliHandler.js

class KbliHandler {
  constructor(bot, dataManager, keyboards, userStateManager) {
    this.bot = bot;
    this.dataManager = dataManager;
    this.keyboards = keyboards;
    this.userStateManager = userStateManager;
  }

  // Handle Tambah KBLI
  handleAddKbli(chatId, kbli) {
    if (this.dataManager.addKbli(chatId, kbli)) {
      this.bot.sendMessage(chatId, `✅ KBLI ${kbli} berhasil ditambahkan!`, this.keyboards.getKbliKeyboard());
    } else {
      this.bot.sendMessage(chatId, `❌ KBLI ${kbli} sudah ada dalam daftar!`, this.keyboards.getKbliKeyboard());
    }
    this.userStateManager.clearState(chatId);
  }

  // Handle Lihat KBLI
  handleViewKbli(chatId) {
    const user = this.dataManager.getUser(chatId);
    const kbliList = user.kbliList;
    
    if (kbliList.length === 0) {
      this.bot.sendMessage(chatId, '📊 Daftar KBLI masih kosong.', this.keyboards.getKbliKeyboard());
    } else {
      const message = '📊 Daftar KBLI Anda:\n\n' + kbliList.map((kbli, index) => `${index + 1}. ${kbli}`).join('\n');
      this.bot.sendMessage(chatId, message, this.keyboards.getKbliKeyboard());
    }
  }

  // Handle Hapus KBLI menu
  handleDeleteKbliMenu(chatId) {
    const user = this.dataManager.getUser(chatId);
    const kbliList = user.kbliList;
    
    if (kbliList.length === 0) {
      this.bot.sendMessage(chatId, '📊 Daftar KBLI masih kosong.', this.keyboards.getKbliKeyboard());
    } else {
      const message = '🗑️ Pilih nomor KBLI yang akan dihapus:\n\n' + 
                     kbliList.map((kbli, index) => `${index + 1}. ${kbli}`).join('\n') +
                     '\n\nKetik nomor urut (contoh: 1):';
      this.bot.sendMessage(chatId, message);
      this.userStateManager.setState(chatId, 'awaiting_delete_kbli');
    }
  }

  // Handle Hapus KBLI
  handleDeleteKbli(chatId, text) {
    const index = parseInt(text) - 1;
    const deletedKbli = this.dataManager.removeKbli(chatId, index);
    
    if (deletedKbli) {
      this.bot.sendMessage(chatId, `✅ KBLI ${deletedKbli} berhasil dihapus!`, this.keyboards.getKbliKeyboard());
    } else {
      this.bot.sendMessage(chatId, '❌ Nomor tidak valid!', this.keyboards.getKbliKeyboard());
    }
    this.userStateManager.clearState(chatId);
  }
}

module.exports = KbliHandler;
