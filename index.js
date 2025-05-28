// index.js - Main entry point for the LPSE Telegram Monitor Bot
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');

// Import services
const DataManager = require('./utils/dataManager');
const UserStateManager = require('./utils/userStateManager');
const Scraper = require('./services/scraper');
const NotificationService = require('./services/notificationService');
const MonitoringService = require('./services/monitoringService');

// Import handlers
const CommandHandlers = require('./handlers/commandHandlers');
const MessageHandlers = require('./handlers/messageHandlers');
const CallbackHandlers = require('./handlers/callbackHandlers');
const KbliHandler = require('./handlers/kbliHandler');
const KeywordHandler = require('./handlers/keywordHandler');
const SettingsHandler = require('./handlers/settingsHandler');

// Import keyboards
const keyboards = require('./utils/keyboards');

// Initialize bot
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Initialize services and managers
const dataManager = new DataManager();
const userStateManager = new UserStateManager();
const scraper = new Scraper();
const notificationService = new NotificationService(bot, dataManager);
const monitoringService = new MonitoringService(dataManager, scraper, notificationService);

// Initialize handlers
const kbliHandler = new KbliHandler(bot, dataManager, keyboards, userStateManager);
const keywordHandler = new KeywordHandler(bot, dataManager, keyboards, userStateManager);
const settingsHandler = new SettingsHandler(bot, dataManager, keyboards);
const commandHandlers = new CommandHandlers(bot, dataManager, keyboards, userStateManager, monitoringService);
const callbackHandlers = new CallbackHandlers(bot, dataManager, settingsHandler);
const messageHandlers = new MessageHandlers(
  bot, 
  dataManager, 
  keyboards, 
  userStateManager, 
  kbliHandler, 
  keywordHandler, 
  settingsHandler, 
  monitoringService,
  commandHandlers
);

// Register handlers
commandHandlers.registerHandlers();
callbackHandlers.registerHandler();
messageHandlers.registerHandler();

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
  monitoringService.stop();
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  monitoringService.stop();
  bot.stopPolling();
  process.exit(0);
});

console.log('🤖 LPSE Telegram Monitor Bot is running...');
console.log('📊 Features available:');
console.log('• User Registration & Management');
console.log('• KBLI Management');
console.log('• Keywords Management'); 
console.log('• Settings Configuration');
console.log('• Real-time Monitoring');
console.log('• Tender Notifications');
console.log('✅ Bot ready to receive commands!');
