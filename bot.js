const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Bot Token
const token = '7495576082:AAHKzQv35NpRtu7_znPRmp5s4RntQLJwZpI';
const bot = new TelegramBot(token, { polling: true });

// Data storage (gunakan database di production)
let users = {};
let isScrapingActive = false;
let scrapingInterval = null;

// Load data dari file jika ada
function loadData() {
  try {
    if (fs.existsSync('bot_users.json')) {
      users = JSON.parse(fs.readFileSync('bot_users.json', 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data ke file
function saveData() {
  try {
    fs.writeFileSync('bot_users.json', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load URLs dari file links.txt
function loadUrlsFromFile() {
  try {
    if (fs.existsSync('links.txt')) {
      const urls = fs.readFileSync('links.txt', 'utf8')
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && url.startsWith('http'));
      return urls;
    }
  } catch (error) {
    console.error('Error loading URLs from file:', error);
  }
  return [];
}

// Load data saat startup
loadData();

// Utility functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function isUserRegistered(chatId) {
  return users.hasOwnProperty(chatId.toString());
}

function createUser(chatId, userData) {
  users[chatId.toString()] = {
    chatId: chatId,
    name: userData.name,
    registeredAt: new Date().toISOString(),
    kbliList: [],
    keywords: [],
    includeNonTender: true,
    isActive: true,
    sentTenders: []
  };
  saveData();
}

// Main Menu Keyboard
function getMainMenuKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['📊 KBLI Management', '🔍 Keywords Management'],
        ['⚙️ Settings', '🚀 Start Monitoring'],
        ['⏹️ Stop Monitoring', '📈 Status'],
        ['👤 Profile']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// KBLI Management Keyboard
function getKbliKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['➕ Add KBLI', '📋 View KBLI'],
        ['🗑️ Delete KBLI', '🏠 Back to Menu']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// Keywords Management Keyboard
function getKeywordsKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['➕ Add Keyword', '📋 View Keywords'],
        ['🗑️ Delete Keyword', '🏠 Back to Menu']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// User states untuk tracking input
let userStates = {};

// Command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!isUserRegistered(chatId)) {
    bot.sendMessage(chatId, 
      `🎉 Selamat datang di LPSE Tender Monitor Bot!\n\n` +
      `Silakan daftar terlebih dahulu dengan mengetik nama Anda:`
    );
    userStates[chatId] = 'awaiting_registration';
  } else {
    bot.sendMessage(chatId, 
      `🏠 Selamat datang kembali, ${users[chatId].name}!\n\n` +
      `Pilih menu di bawah ini:`,
      getMainMenuKeyboard()
    );
  }
});

// Handle text messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Skip if it's a command
  if (text && text.startsWith('/')) return;
  
  // Handle registration
  if (userStates[chatId] === 'awaiting_registration') {
    createUser(chatId, { name: text });
    delete userStates[chatId];
    
    bot.sendMessage(chatId, 
      `✅ Registrasi berhasil! Selamat datang ${text}!\n\n` +
      `Sekarang Anda dapat menggunakan semua fitur bot ini.`,
      getMainMenuKeyboard()
    );
    return;
  }
  
  // Require registration for all other functions
  if (!isUserRegistered(chatId)) {
    bot.sendMessage(chatId, 'Silakan ketik /start untuk mendaftar terlebih dahulu.');
    return;
  }
  
  // Handle different user states
  switch (userStates[chatId]) {
    case 'awaiting_kbli':
      handleAddKbli(chatId, text);
      break;
    case 'awaiting_keyword':
      handleAddKeyword(chatId, text);
      break;
    case 'awaiting_delete_kbli':
      handleDeleteKbli(chatId, text);
      break;
    case 'awaiting_delete_keyword':
      handleDeleteKeyword(chatId, text);
      break;
    default:
      handleMenuSelection(chatId, text);
  }
});

// Menu selection handler
function handleMenuSelection(chatId, text) {
  switch (text) {
    case '📊 KBLI Management':
      bot.sendMessage(chatId, '📊 KBLI Management Menu:', getKbliKeyboard());
      break;
      
    case '🔍 Keywords Management':
      bot.sendMessage(chatId, '🔍 Keywords Management Menu:', getKeywordsKeyboard());
      break;
      
    case '⚙️ Settings':
      handleSettings(chatId);
      break;
      
    case '🚀 Start Monitoring':
      handleStartMonitoring(chatId);
      break;
      
    case '⏹️ Stop Monitoring':
      handleStopMonitoring(chatId);
      break;
      
    case '📈 Status':
      handleStatus(chatId);
      break;
      
    case '👤 Profile':
      handleProfile(chatId);
      break;
      
    case '🏠 Back to Menu':
      bot.sendMessage(chatId, '🏠 Main Menu:', getMainMenuKeyboard());
      break;
      
    // KBLI Menu
    case '➕ Add KBLI':
      bot.sendMessage(chatId, 'Masukkan kode KBLI (contoh: 41001):');
      userStates[chatId] = 'awaiting_kbli';
      break;
      
    case '📋 View KBLI':
      handleViewKbli(chatId);
      break;
      
    case '🗑️ Delete KBLI':
      handleDeleteKbliMenu(chatId);
      break;
      
    // Keywords Menu
    case '➕ Add Keyword':
      bot.sendMessage(chatId, 'Masukkan keyword (contoh: konstruksi):');
      userStates[chatId] = 'awaiting_keyword';
      break;
      
    case '📋 View Keywords':
      handleViewKeywords(chatId);
      break;
      
    case '🗑️ Delete Keyword':
      handleDeleteKeywordMenu(chatId);
      break;
      
    default:
      bot.sendMessage(chatId, 'Menu tidak dikenali. Pilih dari menu yang tersedia.', getMainMenuKeyboard());
  }
}

// KBLI handlers
function handleAddKbli(chatId, kbli) {
  if (!users[chatId].kbliList.includes(kbli)) {
    users[chatId].kbliList.push(kbli);
    saveData();
    bot.sendMessage(chatId, `✅ KBLI ${kbli} berhasil ditambahkan!`, getKbliKeyboard());
  } else {
    bot.sendMessage(chatId, `❌ KBLI ${kbli} sudah ada dalam daftar!`, getKbliKeyboard());
  }
  delete userStates[chatId];
}

function handleViewKbli(chatId) {
  const kbliList = users[chatId].kbliList;
  if (kbliList.length === 0) {
    bot.sendMessage(chatId, '📊 Daftar KBLI masih kosong.', getKbliKeyboard());
  } else {
    const message = '📊 Daftar KBLI Anda:\n\n' + kbliList.map((kbli, index) => `${index + 1}. ${kbli}`).join('\n');
    bot.sendMessage(chatId, message, getKbliKeyboard());
  }
}

function handleDeleteKbliMenu(chatId) {
  const kbliList = users[chatId].kbliList;
  if (kbliList.length === 0) {
    bot.sendMessage(chatId, '📊 Daftar KBLI masih kosong.', getKbliKeyboard());
  } else {
    const message = '🗑️ Pilih nomor KBLI yang akan dihapus:\n\n' + 
                   kbliList.map((kbli, index) => `${index + 1}. ${kbli}`).join('\n') +
                   '\n\nKetik nomor urut (contoh: 1):';
    bot.sendMessage(chatId, message);
    userStates[chatId] = 'awaiting_delete_kbli';
  }
}

function handleDeleteKbli(chatId, text) {
  const index = parseInt(text) - 1;
  const kbliList = users[chatId].kbliList;
  
  if (index >= 0 && index < kbliList.length) {
    const deletedKbli = kbliList.splice(index, 1)[0];
    saveData();
    bot.sendMessage(chatId, `✅ KBLI ${deletedKbli} berhasil dihapus!`, getKbliKeyboard());
  } else {
    bot.sendMessage(chatId, '❌ Nomor tidak valid!', getKbliKeyboard());
  }
  delete userStates[chatId];
}

// Keywords handlers
function handleAddKeyword(chatId, keyword) {
  if (!users[chatId].keywords.includes(keyword.toLowerCase())) {
    users[chatId].keywords.push(keyword.toLowerCase());
    saveData();
    bot.sendMessage(chatId, `✅ Keyword "${keyword}" berhasil ditambahkan!`, getKeywordsKeyboard());
  } else {
    bot.sendMessage(chatId, `❌ Keyword "${keyword}" sudah ada dalam daftar!`, getKeywordsKeyboard());
  }
  delete userStates[chatId];
}

function handleViewKeywords(chatId) {
  const keywords = users[chatId].keywords;
  if (keywords.length === 0) {
    bot.sendMessage(chatId, '🔍 Daftar keywords masih kosong.', getKeywordsKeyboard());
  } else {
    const message = '🔍 Daftar Keywords Anda:\n\n' + keywords.map((keyword, index) => `${index + 1}. ${keyword}`).join('\n');
    bot.sendMessage(chatId, message, getKeywordsKeyboard());
  }
}

function handleDeleteKeywordMenu(chatId) {
  const keywords = users[chatId].keywords;
  if (keywords.length === 0) {
    bot.sendMessage(chatId, '🔍 Daftar keywords masih kosong.', getKeywordsKeyboard());
  } else {
    const message = '🗑️ Pilih nomor keyword yang akan dihapus:\n\n' + 
                   keywords.map((keyword, index) => `${index + 1}. ${keyword}`).join('\n') +
                   '\n\nKetik nomor urut (contoh: 1):';
    bot.sendMessage(chatId, message);
    userStates[chatId] = 'awaiting_delete_keyword';
  }
}

function handleDeleteKeyword(chatId, text) {
  const index = parseInt(text) - 1;
  const keywords = users[chatId].keywords;
  
  if (index >= 0 && index < keywords.length) {
    const deletedKeyword = keywords.splice(index, 1)[0];
    saveData();
    bot.sendMessage(chatId, `✅ Keyword "${deletedKeyword}" berhasil dihapus!`, getKeywordsKeyboard());
  } else {
    bot.sendMessage(chatId, '❌ Nomor tidak valid!', getKeywordsKeyboard());
  }
  delete userStates[chatId];
}

// Settings handler
function handleSettings(chatId) {
  const user = users[chatId];
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: user.includeNonTender ? '✅ Include Non Tender' : '❌ Include Non Tender',
            callback_data: 'toggle_non_tender'
          }
        ],
        [
          {
            text: user.isActive ? '✅ User Active' : '❌ User Active',
            callback_data: 'toggle_user_active'
          }
        ]
      ]
    }
  };
  
  const message = `⚙️ Settings:\n\n` +
                 `Include Non Tender: ${user.includeNonTender ? '✅ Yes' : '❌ No'}\n` +
                 `User Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}\n\n` +
                 `Klik tombol untuk mengubah setting:`;
  
  bot.sendMessage(chatId, message, keyboard);
}

// Callback query handler
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  switch (data) {
    case 'toggle_non_tender':
      users[chatId].includeNonTender = !users[chatId].includeNonTender;
      saveData();
      handleSettings(chatId);
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Setting updated!' });
      break;
      
    case 'toggle_user_active':
      users[chatId].isActive = !users[chatId].isActive;
      saveData();
      handleSettings(chatId);
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Setting updated!' });
      break;
  }
});

// Monitoring handlers
function handleStartMonitoring(chatId) {
  if (isScrapingActive) {
    bot.sendMessage(chatId, '⚠️ Monitoring sudah berjalan!', getMainMenuKeyboard());
    return;
  }
  
  // Check if any user has data
  const activeUsers = Object.values(users).filter(user => 
    user.isActive && 
    (user.kbliList.length > 0 || user.keywords.length > 0)
  );
  
  if (activeUsers.length === 0) {
    bot.sendMessage(chatId, 
      '❌ Tidak ada user dengan data lengkap!\n\n' +
      'Pastikan setiap user memiliki:\n' +
      '• Minimal 1 KBLI atau keyword\n' +
      '• Status active',
      getMainMenuKeyboard()
    );
    return;
  }
  
  // Check if links.txt exists
  const allUrls = loadUrlsFromFile();
  if (allUrls.length === 0) {
    bot.sendMessage(chatId, 
      '❌ File links.txt tidak ditemukan atau kosong!\n\n' +
      'Pastikan file links.txt berisi daftar URL LPSE.',
      getMainMenuKeyboard()
    );
    return;
  }
  
  isScrapingActive = true;
  startScrapingLoop();
  
  // Notify all users
  Object.keys(users).forEach(userId => {
    bot.sendMessage(userId, `🚀 Monitoring tender dimulai! Anda akan mendapat notifikasi jika ada tender yang sesuai.\n\n📊 Monitoring ${allUrls.length} URL LPSE`);
  });
}

function handleStopMonitoring(chatId) {
  if (!isScrapingActive) {
    bot.sendMessage(chatId, '⚠️ Monitoring tidak sedang berjalan!', getMainMenuKeyboard());
    return;
  }
  
  isScrapingActive = false;
  if (scrapingInterval) {
    clearTimeout(scrapingInterval);
    scrapingInterval = null;
  }
  
  // Notify all users
  Object.keys(users).forEach(userId => {
    bot.sendMessage(userId, '⏹️ Monitoring tender dihentikan.');
  });
}

// Status handler
function handleStatus(chatId) {
  const user = users[chatId];
  const totalUsers = Object.keys(users).length;
  const activeUsers = Object.values(users).filter(u => u.isActive).length;
  const totalUrls = loadUrlsFromFile().length;
  
  const message = `📈 Status Bot:\n\n` +
                 `🤖 Monitoring: ${isScrapingActive ? '🟢 Active' : '🔴 Inactive'}\n` +
                 `👥 Total Users: ${totalUsers}\n` +
                 `✅ Active Users: ${activeUsers}\n` +
                 `🌐 Total LPSE URLs: ${totalUrls}\n\n` +
                 `📊 Your Data:\n` +
                 `• KBLI: ${user.kbliList.length} items\n` +
                 `• Keywords: ${user.keywords.length} items\n` +
                 `• Non Tender: ${user.includeNonTender ? 'Included' : 'Excluded'}\n` +
                 `• Status: ${user.isActive ? 'Active' : 'Inactive'}\n` +
                 `• Notifications Sent: ${user.sentTenders.length}`;
  
  bot.sendMessage(chatId, message, getMainMenuKeyboard());
}

// Profile handler
function handleProfile(chatId) {
  const user = users[chatId];
  const message = `👤 Profile:\n\n` +
                 `📛 Name: ${user.name}\n` +
                 `🆔 Chat ID: ${user.chatId}\n` +
                 `📅 Registered: ${new Date(user.registeredAt).toLocaleDateString('id-ID')}\n` +
                 `📊 KBLI Count: ${user.kbliList.length}\n` +
                 `🔍 Keywords Count: ${user.keywords.length}\n` +
                 `📢 Total Notifications: ${user.sentTenders.length}`;
  
  bot.sendMessage(chatId, message, getMainMenuKeyboard());
}

// Scraping functions
async function scrape(url, kbliList) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });
    
    const $ = cheerio.load(data);
    const tbody = $('tbody');
    let title = $('title');
    let namaInstansi = title.text().trim().split(' - ')[0];
    
    const rows = tbody.find('tr').toArray();
    const results = [];
    
    for (const element of rows) {
      const linkElement = $(element).find('td a');
      const hpsElement = $(element).find('td.table-hps');
      const tanggalAkhirElement = $(element).find('td.center');
      
      if (linkElement.length === 0 || hpsElement.length === 0 || tanggalAkhirElement.length === 0) {
        continue;
      }
      
      const linkpaket = linkElement.attr('href');
      const link = new URL(linkpaket, url).href;
      const namaPaket = linkElement.text().trim();
      const hps = hpsElement.text().trim();
      const tanggalAkhir = tanggalAkhirElement.text().trim();
      
      const patternKodeTender = /\/(\d+)\//;
      const match = link.match(patternKodeTender);
      const kodeTender = match ? match[1] : 'Tidak Diketahui';
      
      let jenisPengadaan;
      if (link.includes('/nontender/')) {
        jenisPengadaan = 'Non Tender';
      } else if (link.includes('/lelang/')) {
        jenisPengadaan = 'Tender';
      } else {
        jenisPengadaan = 'Tidak Diketahui';
      }
      
      let matchedKbli = [];
      try {
        const response = await axios.get(link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            'Referer': url
          }
        });
        const responseData = response.data;
        
        matchedKbli = kbliList.filter(kbli => {
          const regex = new RegExp(`\\b${kbli}\\b`);
          return regex.test(responseData);
        });
      } catch (error) {
        console.error('Error saat melakukan HTTP request ke link:', error);
      }
      
      results.push({
        namaInstansi,
        link,
        namaPaket,
        hps,
        tanggalAkhir,
        kodeTender,
        jenisPengadaan,
        matchedKbli
      });
      
      await delay(2000);
    }
    
    return results;
  } catch (error) {
    console.error(`Error saat melakukan scraping untuk ${url}:`, error);
    return [];
  }
}

async function checkAndNotify(scrapeResult, user) {
  for (const result of scrapeResult) {
    const { namaInstansi, link, namaPaket, hps, tanggalAkhir, kodeTender, jenisPengadaan, matchedKbli } = result;
    
    // Filter Non Tender
    if (!user.includeNonTender && jenisPengadaan === 'Non Tender') {
      continue;
    }
    
    // Check KBLI match
    const finalMatchKbli = matchedKbli.some(kbli => user.kbliList.includes(kbli));
    
    // Check keyword match
    const finalMatchKeyword = user.keywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(namaPaket);
    });
    
    if (finalMatchKbli || finalMatchKeyword) {
      // Check if already sent
      if (!user.sentTenders.includes(kodeTender)) {
        const detailPaket = 
          '🎯 TENDER NOTIFICATION 🎯\n\n' +
          '🏢 Nama Instansi: ' + namaInstansi + '\n' +
          '🔗 Link LPSE: ' + link + '\n' +
          '📦 Nama Paket: ' + namaPaket + '\n' +
          '⚖️ Jenis Pengadaan: ' + jenisPengadaan + '\n' +
          '🔢 Kode Tender: ' + kodeTender + '\n' +
          '📊 Kode KBLI: ' + (matchedKbli.length > 0 ? matchedKbli.join(', ') : 'Keyword Match') + '\n' +
          '💰 HPS: ' + hps + '\n' +
          '📅 Tanggal Akhir: ' + tanggalAkhir + '\n\n' +
          (finalMatchKbli ? '✅ Match: KBLI\n' : '') +
          (finalMatchKeyword ? '✅ Match: Keyword\n' : '') +
          '\n📲 Segera cek dan daftar!';
        
        try {
          await bot.sendMessage(user.chatId, detailPaket);
          user.sentTenders.push(kodeTender);
          saveData();
          console.log(`Notifikasi dikirim ke ${user.name} untuk tender ${kodeTender}`);
        } catch (error) {
          console.error(`Error mengirim notifikasi ke ${user.name}:`, error);
        }
        
        await delay(1000);
      }
    }
  }
}

// Main scraping loop
async function startScrapingLoop() {
  console.log('Starting scraping loop...');
  
  while (isScrapingActive) {
    try {
      const activeUsers = Object.values(users).filter(user => 
        user.isActive && 
        (user.kbliList.length > 0 || user.keywords.length > 0)
      );
      
      if (activeUsers.length === 0) {
        console.log('No active users with complete data');
        await delay(60000); // Wait 1 minute
        continue;
      }
      
      // Get all URLs from links.txt
      const allUrls = loadUrlsFromFile();
      if (allUrls.length === 0) {
        console.log('No URLs found in links.txt');
        await delay(60000); // Wait 1 minute
        continue;
      }
      
      const allKbli = [...new Set(activeUsers.flatMap(user => user.kbliList))];
      
      for (const url of allUrls) {
        console.log('Checking URL:', url);
        const scrapeResult = await scrape(url, allKbli);
        
        for (const user of activeUsers) {
          await checkAndNotify(scrapeResult, user);
        }
        
        await delay(5000); // Delay between URLs
      }
      
      console.log('Scraping cycle completed. Waiting for next cycle...');
      await delay(300000); // Wait 5 minutes between cycles
      
    } catch (error) {
      console.error('Error in scraping loop:', error);
      await delay(60000); // Wait 1 minute on error
    }
  }
  
  console.log('Scraping loop stopped');
}

// Admin commands (optional)
bot.onText(/\/admin_stats/, (msg) => {
  const chatId = msg.chat.id;
  
  // You can add admin user IDs here
  const adminIds = ['262323498']; // Replace with actual admin chat IDs
  
  if (!adminIds.includes(chatId.toString())) {
    bot.sendMessage(chatId, '❌ Unauthorized');
    return;
  }
  
  const totalUsers = Object.keys(users).length;
  const activeUsers = Object.values(users).filter(u => u.isActive).length;
  const totalNotifications = Object.values(users).reduce((sum, user) => sum + user.sentTenders.length, 0);
  const totalKbli = Object.values(users).reduce((sum, user) => sum + user.kbliList.length, 0);
  const totalKeywords = Object.values(users).reduce((sum, user) => sum + user.keywords.length, 0);
  const totalUrls = loadUrlsFromFile().length;
  
  const message = `📊 ADMIN STATISTICS\n\n` +
                 `👥 Total Users: ${totalUsers}\n` +
                 `✅ Active Users: ${activeUsers}\n` +
                 `🤖 Monitoring Status: ${isScrapingActive ? '🟢 Active' : '🔴 Inactive'}\n` +
                 `📢 Total Notifications Sent: ${totalNotifications}\n` +
                 `📊 Total KBLI Entries: ${totalKbli}\n` +
                 `🔍 Total Keywords: ${totalKeywords}\n` +
                 `🌐 Total URLs in links.txt: ${totalUrls}\n` +
                 `💾 Bot Uptime: ${process.uptime().toFixed(0)}s`;
  
  bot.sendMessage(chatId, message);
});

// Broadcast message to all users (admin only)
bot.onText(/\/admin_broadcast (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const message = match[1];
  
  // You can add admin user IDs here
  const adminIds = ['262323498']; // Replace with actual admin chat IDs
  
  if (!adminIds.includes(chatId.toString())) {
    bot.sendMessage(chatId, '❌ Unauthorized');
    return;
  }
  
  let sentCount = 0;
  Object.keys(users).forEach(async (userId) => {
    try {
      await bot.sendMessage(userId, `📢 BROADCAST MESSAGE:\n\n${message}`);
      sentCount++;
    } catch (error) {
      console.error(`Failed to send broadcast to ${userId}:`, error);
    }
  });
  
  bot.sendMessage(chatId, `✅ Broadcast sent to ${sentCount} users`);
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Graceful shutdown...');
  isScrapingActive = false;
  if (scrapingInterval) {
    clearTimeout(scrapingInterval);
  }
  saveData();
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  isScrapingActive = false;
  if (scrapingInterval) {
    clearTimeout(scrapingInterval);
  }
  saveData();
  bot.stopPolling();
  process.exit(0);
});

console.log('🤖 LPSE Telegram Monitor Bot is running...');
console.log('📊 Features available:');
console.log('• User Registration & Management');
console.log('• KBLI Management');
console.log('• Keywords Management'); 
console.log('• URL Management');
console.log('• Settings Configuration');
console.log('• Real-time Monitoring');
console.log('• Tender Notifications');
console.log('✅ Bot ready to receive commands!');