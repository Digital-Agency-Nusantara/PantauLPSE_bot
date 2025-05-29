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
      '🔴 Berhenti Monitoring' : '🟢 Mulai Monitoring';
      
    return {
      reply_markup: {
        keyboard: [
          ['📊 Daftar KBLI', '🔍 Daftar Kata Kunci'],
          ['⚙️ Pengaturan', monitoringButton],
          ['📈 Status', '👤 Profil'],
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
          ['⚙️ Pengaturan', '📈 Status'],
          ['👤 Profil', '💰 Beli Masa Aktif'],
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
          ['🗑️ Hapus KBLI', '🏠 Kembali ke Menu']
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
          ['🗑️ Hapus Kata Kunci', '🏠 Kembali ke Menu']
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
              text: user.includeNonTender ? '✅ Termasuk Non Tender' : '❌ Tidak Termasuk Non Tender',
              callback_data: 'toggle_non_tender'
            }
          ],
          [
            {
              text: user.isActive ? '✅ Aktif' : '❌ Nonaktif',
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