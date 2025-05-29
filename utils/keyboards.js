// utils/keyboards.js
const config = require('../config/config');

// Main Menu Keyboard
function getMainMenuKeyboard(chatId) {
  const isAdmin = chatId && config.ADMIN_IDS.includes(chatId.toString());
  // Get monitoring status
  let monitoringStatus = false;
  try {
    // Cek apakah ada module monitoringService yang bisa diakses
    const monitoringService = require('../services/monitoringService');
    if (global.monitoringServiceInstance) {
      monitoringStatus = global.monitoringServiceInstance.isActive;
    }
  } catch (error) {
    console.log('Error getting monitoring status:', error.message);
  }
  
  // Keyboard untuk admin (dengan tombol toggle Monitoring)
  if (isAdmin) {
    const monitoringButton = monitoringStatus ? 
      '🔴 Stop Monitoring' : '🟢 Start Monitoring';
      
    return {
      reply_markup: {
        keyboard: [
          ['📊 Daftar KBLI', '🔍 Daftar Kata Kunci'],
          ['⚙️ Settings', monitoringButton],
          ['📈 Status', '👤 Profile'],
          ['🔄 Set Masa Aktif', '❓ Bantuan']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }
    
    // Keyboard untuk pengguna biasa (tanpa tombol Start/Stop Monitoring)
    return {
      reply_markup: {
        keyboard: [
          ['📊 Daftar KBLI', '🔍 Daftar Kata Kunci'],
          ['⚙️ Settings', '📈 Status'],
          ['👤 Profile', '💰 Beli Masa Aktif'],
          ['❓ Bantuan']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }
  
  // Daftar KBLI Keyboard
  function getKbliKeyboard() {
    return {
      reply_markup: {
        keyboard: [
          ['➕ Tambah KBLI', '📋 Lihat KBLI'],
          ['🗑️ Delete KBLI', '🏠 Back to Menu']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }
  
  // Daftar Kata Kunci Keyboard
  function getKeywordsKeyboard() {
    return {
      reply_markup: {
        keyboard: [
          ['➕ Tambah Kata Kunci', '📋 Lihat Kata Kunci'],
          ['🗑️ Delete Keyword', '🏠 Back to Menu']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }
  
  // Settings Keyboard
  function getSettingsKeyboard(user) {
    return {
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
          ],
          [
            {
              text: '💰 Beli Masa Aktif',
              url: config.ADMIN_WA
            }
          ]
        ]
      }
    };
  }
  
  module.exports = {
    getMainMenuKeyboard,
    getKbliKeyboard,
    getKeywordsKeyboard,
    getSettingsKeyboard
  };