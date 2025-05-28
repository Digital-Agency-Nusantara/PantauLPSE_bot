// utils/userStateManager.js

class UserStateManager {
  constructor() {
    this.userStates = {};
    this.tempData = {};
  }

  // Set state for a user
  setState(chatId, state) {
    this.userStates[chatId] = state;
  }

  // Get state for a user
  getState(chatId) {
    return this.userStates[chatId];
  }

  // Clear state for a user
  clearState(chatId) {
    delete this.userStates[chatId];
  }
  
  // Set temporary data for a user during registration
  setTempData(chatId, key, value) {
    if (!this.tempData[chatId]) {
      this.tempData[chatId] = {};
    }
    this.tempData[chatId][key] = value;
  }
  
  // Get temporary data for a user
  getTempData(chatId, key) {
    if (!this.tempData[chatId]) {
      return '';
    }
    return this.tempData[chatId][key] || '';
  }
  
  // Clear all temporary data for a user
  clearTempData(chatId) {
    delete this.tempData[chatId];
  }
}

module.exports = UserStateManager;
