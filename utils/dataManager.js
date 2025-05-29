// utils/dataManager.js
const fs = require('fs');
const config = require('../config/config');

class DataManager {
  constructor() {
    this.users = {};
    this.loadData();
  }

  // Load data dari file jika ada
  loadData() {
    try {
      if (fs.existsSync(config.USERS_FILE)) {
        this.users = JSON.parse(fs.readFileSync(config.USERS_FILE, 'utf8'));
        console.log(`Loaded ${Object.keys(this.users).length} users from file`);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Save data ke file
  saveData() {
    try {
      fs.writeFileSync(config.USERS_FILE, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Load URLs dari file links.txt
  loadUrlsFromFile() {
    try {
      if (fs.existsSync(config.LINKS_FILE)) {
        const urls = fs.readFileSync(config.LINKS_FILE, 'utf8')
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

  // User management methods
  isUserRegistered(chatId) {
    return this.users.hasOwnProperty(chatId.toString());
  }

  createUser(chatId, userData) {
    // Set default expiry date to 7 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Default 30 days
    
    this.users[chatId.toString()] = {
      chatId: parseInt(chatId),
      name: userData.name || '',
      company: userData.company || '',
      whatsapp: userData.whatsapp || '',
      username: userData.username || '',
      registeredAt: new Date().toISOString(),
      expiryDate: userData.expiryDate || expiryDate.toISOString(),
      kbliList: [],
      keywords: [],
      includeNonTender: true,
      isActive: true,
      sentTenders: []
    };
    this.saveData();
    return this.users[chatId.toString()];
  }

  getUser(chatId) {
    return this.users[chatId.toString()];
  }
  
  // Check if user account is expired
  isUserExpired(chatId) {
    const user = this.getUser(chatId);
    if (!user || !user.expiryDate) return false;
    
    const now = new Date();
    const expiryDate = new Date(user.expiryDate);
    
    return now > expiryDate;
  }
  
  // Update user expiry date
  updateUserExpiry(chatId, durationDays) {
    const user = this.getUser(chatId);
    if (!user) return false;
    
    // Jika pengguna sudah memiliki tanggal kedaluwarsa, tambahkan durasi dari tanggal tersebut
    // Jika tidak, gunakan tanggal sekarang sebagai dasar
    let expiryDate;
    if (user.expiryDate) {
      const currentExpiry = new Date(user.expiryDate);
      // Jika tanggal kedaluwarsa sudah lewat, gunakan tanggal sekarang
      if (currentExpiry < new Date()) {
        expiryDate = new Date();
      } else {
        expiryDate = currentExpiry;
      }
    } else {
      expiryDate = new Date();
    }
    
    // Tambahkan durasi
    expiryDate.setDate(expiryDate.getDate() + durationDays);
    
    user.expiryDate = expiryDate.toISOString();
    this.saveData();
    
    return true;
  }

  updateUser(chatId, updates) {
    const user = this.users[chatId.toString()];
    if (!user) return false;
    
    // Update user data
    Object.assign(user, updates);
    
    // Save changes
    this.saveData();
    
    return true;
  }

  getAllUsers() {
    return this.users;
  }

  getActiveUsers() {
    // Update user active status based on expiry date first
    this.updateAllUserActiveStatus();
    
    return Object.values(this.users).filter(user => {
      return user.isActive && 
        (user.kbliList.length > 0 || user.keywords.length > 0);
    });
  }
  
  // Update active status for all users based on expiry date
  updateAllUserActiveStatus() {
    const now = new Date();
    
    Object.values(this.users).forEach(user => {
      if (user.expiryDate) {
        const expiryDate = new Date(user.expiryDate);
        // If expired, set isActive to false
        if (now > expiryDate && user.isActive) {
          user.isActive = false;
          console.log(`User ${user.chatId} (${user.name}) subscription expired. Setting isActive to false.`);
        }
      }
    });
    
    // Save changes to file
    this.saveData();
  }

  // KBLI management
  addKbli(chatId, kbli) {
    const user = this.getUser(chatId);
    if (user && !user.kbliList.includes(kbli)) {
      user.kbliList.push(kbli);
      this.saveData();
      return true;
    }
    return false;
  }

  removeKbli(chatId, index) {
    const user = this.getUser(chatId);
    if (user && index >= 0 && index < user.kbliList.length) {
      const removed = user.kbliList.splice(index, 1)[0];
      this.saveData();
      return removed;
    }
    return null;
  }

  // Keywords management
  addKeyword(chatId, keyword) {
    const user = this.getUser(chatId);
    if (user && !user.keywords.includes(keyword.toLowerCase())) {
      user.keywords.push(keyword.toLowerCase());
      this.saveData();
      return true;
    }
    return false;
  }

  removeKeyword(chatId, index) {
    const user = this.getUser(chatId);
    if (user && index >= 0 && index < user.keywords.length) {
      const removed = user.keywords.splice(index, 1)[0];
      this.saveData();
      return removed;
    }
    return null;
  }

  // Notification management
  addSentTender(chatId, kodeTender) {
    const user = this.getUser(chatId);
    if (user && !user.sentTenders.includes(kodeTender)) {
      user.sentTenders.push(kodeTender);
      this.saveData();
      return true;
    }
    return false;
  }

  // Statistics
  getStats() {
    const allUsers = Object.values(this.users);
    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.isActive).length,
      totalNotifications: allUsers.reduce((sum, user) => sum + user.sentTenders.length, 0),
      totalKbli: allUsers.reduce((sum, user) => sum + user.kbliList.length, 0),
      totalKeywords: allUsers.reduce((sum, user) => sum + user.keywords.length, 0),
      totalUrls: this.loadUrlsFromFile().length
    };
  }
}

module.exports = DataManager;