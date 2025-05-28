// config/config.js
const config = {
    // Bot Token
    BOT_TOKEN: '7495576082:AAHKzQv35NpRtu7_znPRmp5s4RntQLJwZpI',
    
    // File paths
    USERS_FILE: 'bot_users.json',
    LINKS_FILE: 'links.txt',
    
    // Admin settings
    ADMIN_IDS: ['262323498'],
    
    // Scraping settings
    SCRAPING_INTERVAL: 300000, // 5 minutes
    URL_DELAY: 5000, // 5 seconds between URLs
    REQUEST_DELAY: 2000, // 2 seconds between requests
    ERROR_DELAY: 60000, // 1 minute on error
    
    // User agent for scraping
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  };
  
  module.exports = config;