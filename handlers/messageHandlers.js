// handlers/messageHandlers.js
const config = require('../config/config');

class MessageHandlers {
  constructor(bot, dataManager, keyboards, userStateManager, kbliHandler, keywordHandler, settingsHandler, monitoringService, commandHandlers) {
    this.bot = bot;
    this.dataManager = dataManager;
    this.keyboards = keyboards;
    this.userStateManager = userStateManager;
    this.kbliHandler = kbliHandler;
    this.keywordHandler = keywordHandler;
    this.settingsHandler = settingsHandler;
    this.monitoringService = monitoringService;
    this.commandHandlers = commandHandlers;
  }

  // Handle registration name
  handleRegistrationName(chatId, text) {
    // Store name temporarily
    this.userStateManager.setTempData(chatId, 'name', text);
    
    // Ask for company name
    this.bot.sendMessage(chatId, 
      `Terima kasih, ${text}!\n\n` +
      `Mohon masukkan nama perusahaan / PT Anda:`
    );
    this.userStateManager.setState(chatId, 'awaiting_company');
  }

  // Handle registration company
  handleRegistrationCompany(chatId, text) {
    // Store company name temporarily
    this.userStateManager.setTempData(chatId, 'company', text);
    
    // Ask for WhatsApp number
    this.bot.sendMessage(chatId, 
      `Terima kasih!\n\n` +
      `Mohon masukkan nomor WhatsApp Anda (contoh: 081234567890):`
    );
    this.userStateManager.setState(chatId, 'awaiting_whatsapp');
  }

  // Handle registration WhatsApp
  handleRegistrationWhatsApp(chatId, text, msg) {
    // Validate WhatsApp number format
    const whatsappRegex = /^[0-9]{10,15}$/;
    if (!whatsappRegex.test(text)) {
      this.bot.sendMessage(chatId, 
        `Format nomor WhatsApp tidak valid. Mohon masukkan hanya angka (10-15 digit).\n\n` +
        `Contoh: 081234567890`
      );
      return;
    }
    
    // Store WhatsApp number temporarily
    this.userStateManager.setTempData(chatId, 'whatsapp', text);
    
    // Get username from message
    const username = msg.from.username || '';
    
    // Store username temporarily
    this.userStateManager.setTempData(chatId, 'username', username);
    
    // Ask for KBLI
    this.bot.sendMessage(chatId, 
      `Terima kasih!\n\n` +
      `Sekarang, mohon masukkan kode KBLI usaha Anda (contoh: 41001):\n\n` +
      `KBLI adalah Klasifikasi Baku Lapangan Usaha Indonesia yang digunakan dalam tender pemerintah.\n` +
      `Anda dapat menemukan kode KBLI di NIB/SIUP/TDP perusahaan Anda.`
    );
    this.userStateManager.setState(chatId, 'awaiting_kbli_registration');
  }
  
  // Handle registration KBLI
  handleRegistrationKBLI(chatId, text) {
    // Validate KBLI format (usually 5 digits)
    const kbliRegex = /^\d{5}$/;
    if (!kbliRegex.test(text)) {
      this.bot.sendMessage(chatId, 
        `Format kode KBLI tidak valid. Mohon masukkan 5 digit angka.\n\n` +
        `Contoh: 41001`
      );
      return;
    }
    
    // Store KBLI temporarily
    this.userStateManager.setTempData(chatId, 'kbli', text);
    
    // Ask for keyword
    this.bot.sendMessage(chatId, 
      `Terima kasih!\n\n` +
      `Terakhir, mohon masukkan kata kunci bidang pekerjaan yang Anda minati (contoh: konstruksi):\n\n` +
      `Kata kunci ini akan digunakan untuk mencari tender yang sesuai dengan bidang usaha Anda.`
    );
    this.userStateManager.setState(chatId, 'awaiting_keyword_registration');
  }
  
  // Handle registration keyword
  handleRegistrationKeyword(chatId, text) {
    // Store keyword temporarily
    this.userStateManager.setTempData(chatId, 'keyword', text);
    
    // Complete registration
    const userData = {
      name: this.userStateManager.getTempData(chatId, 'name'),
      company: this.userStateManager.getTempData(chatId, 'company'),
      whatsapp: this.userStateManager.getTempData(chatId, 'whatsapp'),
      username: this.userStateManager.getTempData(chatId, 'username')
    };
    
    // Create user
    this.dataManager.createUser(chatId, userData);
    
    // Add KBLI
    const kbli = this.userStateManager.getTempData(chatId, 'kbli');
    this.dataManager.addKbli(chatId, kbli);
    
    // Add keyword
    const keyword = this.userStateManager.getTempData(chatId, 'keyword');
    this.dataManager.addKeyword(chatId, keyword);
    
    // Clear temporary data and state
    this.userStateManager.clearTempData(chatId);
    this.userStateManager.clearState(chatId);
    
    // Send success message
    this.bot.sendMessage(chatId, 
      `✅ Registrasi berhasil! Selamat datang ${userData.name}!\n\n` +
      `Data Anda:\n` +
      `👤 Nama: ${userData.name}\n` +
      `🏢 Perusahaan: ${userData.company}\n` +
      `📱 WhatsApp: ${userData.whatsapp}\n` +
      `📊 KBLI: ${kbli}\n` +
      `🔍 Keyword: ${keyword}\n\n` +
      `Anda akan mulai menerima informasi tender yang sesuai dengan KBLI dan keyword Anda.\n\n` +
      `Jika Anda ingin menambahkan KBLI atau keyword lainnya, silakan gunakan menu KBLI Management dan Keywords Management.`,
      this.keyboards.getMainMenuKeyboard(chatId)
    );
  }

  // Handle registration (main function)
  handleRegistration(chatId, text, msg) {
    // This function now just routes to the appropriate handler
    const state = this.userStateManager.getState(chatId);
    
    switch (state) {
      case 'awaiting_registration':
        this.handleRegistrationName(chatId, text);
        break;
      case 'awaiting_company':
        this.handleRegistrationCompany(chatId, text);
        break;
      case 'awaiting_whatsapp':
        this.handleRegistrationWhatsApp(chatId, text, msg);
        break;
      case 'awaiting_kbli_registration':
        this.handleRegistrationKBLI(chatId, text);
        break;
      case 'awaiting_keyword_registration':
        this.handleRegistrationKeyword(chatId, text);
        break;
    }
  }

  // Handle menu selection
  handleMenuSelection(chatId, text) {
    switch (text) {
      case '📊 KBLI Management':
        this.bot.sendMessage(chatId, '📊 KBLI Management Menu:', this.keyboards.getKbliKeyboard());
        break;
        
      case '🔍 Keywords Management':
        this.bot.sendMessage(chatId, '🔍 Keywords Management Menu:', this.keyboards.getKeywordsKeyboard());
        break;
        
      case '⚙️ Settings':
        this.settingsHandler.handleSettings(chatId);
        break;
        
      case '🟢 Start Monitoring':
        this.handleStartMonitoring(chatId);
        break;
        
      case '🔴 Stop Monitoring':
        this.handleStopMonitoring(chatId);
        break;
        
      case '📈 Status':
        this.handleStatus(chatId);
        break;
        
      case '👤 Profile':
        this.handleProfile(chatId);
        break;
        
      case '❓ Bantuan':
        // Panggil fungsi handleHelp dari commandHandlers
        if (this.commandHandlers) {
          this.commandHandlers.handleHelp({ chat: { id: chatId } });
        } else {
          // Fallback jika commandHandlers tidak tersedia
          this.bot.sendMessage(chatId, 'Untuk bantuan, silakan ketik /help');
        }
        break;
        
      case '🏠 Back to Menu':
        this.bot.sendMessage(chatId, '🏠 Main Menu:', this.keyboards.getMainMenuKeyboard(chatId));
        break;
        
      // KBLI Menu
      case '➕ Add KBLI':
        this.bot.sendMessage(chatId, 'Masukkan kode KBLI (contoh: 41001):');
        this.userStateManager.setState(chatId, 'awaiting_kbli');
        break;
        
      case '📋 View KBLI':
        this.kbliHandler.handleViewKbli(chatId);
        break;
        
      case '🗑️ Delete KBLI':
        this.kbliHandler.handleDeleteKbliMenu(chatId);
        break;
        
      // Keywords Menu
      case '➕ Add Keyword':
        this.bot.sendMessage(chatId, 'Masukkan keyword (contoh: konstruksi):');
        this.userStateManager.setState(chatId, 'awaiting_keyword');
        break;
        
      case '📋 View Keywords':
        this.keywordHandler.handleViewKeywords(chatId);
        break;
        
      case '🗑️ Delete Keyword':
        this.keywordHandler.handleDeleteKeywordMenu(chatId);
        break;
        
      default:
        this.bot.sendMessage(chatId, 'Menu tidak dikenali. Pilih dari menu yang tersedia.', this.keyboards.getMainMenuKeyboard(chatId));
    }
  }

  // Handle start monitoring
  async handleStartMonitoring(chatId) {
    // Check if user is admin
    if (!config.ADMIN_IDS.includes(chatId.toString())) {
      this.bot.sendMessage(chatId, '❌ Maaf, hanya admin yang dapat memulai monitoring.', this.keyboards.getMainMenuKeyboard(chatId));
      return;
    }
    
    const result = await this.monitoringService.start();
    
    // Pastikan keyboard diperbarui setelah status monitoring berubah
    const updatedKeyboard = this.keyboards.getMainMenuKeyboard(chatId);
    
    // Kirim pesan konfirmasi dengan keyboard yang sudah diperbarui
    if (result.success) {
      this.bot.sendMessage(chatId, `${result.message}\n\nStatus monitoring sekarang: 🟢 ACTIVE`, updatedKeyboard);
    } else {
      this.bot.sendMessage(chatId, result.message, updatedKeyboard);
    }
  }

  // Handle stop monitoring
  async handleStopMonitoring(chatId) {
    // Check if user is admin
    if (!config.ADMIN_IDS.includes(chatId.toString())) {
      this.bot.sendMessage(chatId, '❌ Maaf, hanya admin yang dapat menghentikan monitoring.', this.keyboards.getMainMenuKeyboard(chatId));
      return;
    }
    
    const result = await this.monitoringService.stop();
    
    // Pastikan keyboard diperbarui setelah status monitoring berubah
    const updatedKeyboard = this.keyboards.getMainMenuKeyboard(chatId);
    
    // Kirim pesan konfirmasi dengan keyboard yang sudah diperbarui
    this.bot.sendMessage(chatId, `${result.message}\n\nStatus monitoring sekarang: 🔴 INACTIVE`, updatedKeyboard);
  }

  // Handle status
  handleStatus(chatId) {
    const user = this.dataManager.getUser(chatId);
    const stats = this.monitoringService.getStatus();
    
    const message = `📈 Status Bot:\n\n` +
                   `🤖 Monitoring: ${stats.isActive ? '🟢 Active' : '🔴 Inactive'}\n` +
                  //  `👥 Total Users: ${stats.totalUsers}\n` +
                  //  `✅ Active Users: ${stats.activeUsers}\n\n` +
                   `📊 Your Data:\n` +
                   `• KBLI: ${user.kbliList.length} items\n` +
                   `• Keywords: ${user.keywords.length} items\n` +
                   `• Non Tender: ${user.includeNonTender ? 'Included' : 'Excluded'}\n` +
                   `• Status: ${user.isActive ? 'Active' : 'Inactive'}\n` +
                   `• Notifications Sent: ${user.sentTenders.length}`;
    
    this.bot.sendMessage(chatId, message, this.keyboards.getMainMenuKeyboard(chatId));
  }

  // Handle profile
  handleProfile(chatId) {
    const user = this.dataManager.getUser(chatId);
    const message = `👤 Profile:\n\n` +
                   `📛 Name: ${user.name}\n` +
                   `🏢 Company: ${user.company || 'Not provided'}\n` +
                   `📱 WhatsApp: ${user.whatsapp || 'Not provided'}\n` +
                   `📲 Telegram: ${user.username ? '@' + user.username : 'Not provided'}\n` +
                   `🔒 Chat ID: ${user.chatId}\n` +
                   `📅 Registered: ${new Date(user.registeredAt).toLocaleDateString('id-ID')}\n` +
                   `📊 KBLI Count: ${user.kbliList.length}\n` +
                   `🔍 Keywords Count: ${user.keywords.length}\n` +
                   `📢 Total Notifications: ${user.sentTenders.length}`;
    
    this.bot.sendMessage(chatId, message, this.keyboards.getMainMenuKeyboard(chatId));
  }

  // Handle message
  handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Skip if it's a command
    if (text && text.startsWith('/')) return;
    
    // Handle registration process
    if (this.userStateManager.getState(chatId) === 'awaiting_registration' ||
        this.userStateManager.getState(chatId) === 'awaiting_company' ||
        this.userStateManager.getState(chatId) === 'awaiting_whatsapp' ||
        this.userStateManager.getState(chatId) === 'awaiting_kbli_registration' ||
        this.userStateManager.getState(chatId) === 'awaiting_keyword_registration') {
      this.handleRegistration(chatId, text, msg);
      return;
    }
    
    // Require registration for all other functions
    if (!this.dataManager.isUserRegistered(chatId)) {
      this.bot.sendMessage(chatId, 'Silakan ketik /start untuk mendaftar terlebih dahulu.');
      return;
    }
    
    // Handle different user states
    switch (this.userStateManager.getState(chatId)) {
      case 'awaiting_kbli':
        this.kbliHandler.handleAddKbli(chatId, text);
        break;
      case 'awaiting_keyword':
        this.keywordHandler.handleAddKeyword(chatId, text);
        break;
      case 'awaiting_delete_kbli':
        this.kbliHandler.handleDeleteKbli(chatId, text);
        break;
      case 'awaiting_delete_keyword':
        this.keywordHandler.handleDeleteKeyword(chatId, text);
        break;
      default:
        this.handleMenuSelection(chatId, text);
    }
  }

  // Register message handler
  registerHandler() {
    this.bot.on('message', (msg) => this.handleMessage(msg));
  }
}

module.exports = MessageHandlers;
