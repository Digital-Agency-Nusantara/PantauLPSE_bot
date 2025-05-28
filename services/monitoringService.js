// services/monitoringService.js
const config = require('../config/config');

class MonitoringService {
  constructor(dataManager, scraper, notificationService) {
    this.dataManager = dataManager;
    this.scraper = scraper;
    this.notificationService = notificationService;
    this.isActive = false;
    this.scrapingInterval = null;
    this.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  }

  async start() {
    if (this.isActive) {
      return { success: false, message: 'Monitoring sudah berjalan!' };
    }

    // Check if any user has data
    const activeUsers = this.dataManager.getActiveUsers();
    if (activeUsers.length === 0) {
      return {
        success: false,
        message: 'Tidak ada user dengan data lengkap!\n\nPastikan setiap user memiliki:\n• Minimal 1 KBLI atau keyword\n• Status active'
      };
    }

    // Check if links.txt exists
    const allUrls = this.dataManager.loadUrlsFromFile();
    if (allUrls.length === 0) {
      return {
        success: false,
        message: 'File links.txt tidak ditemukan atau kosong!\n\nPastikan file links.txt berisi daftar URL LPSE.'
      };
    }

    this.isActive = true;
    this.startScrapingLoop();
    
    // Notify all users
    await this.notificationService.notifyMonitoringStart(allUrls.length);

    return {
      success: true,
      message: `Monitoring dimulai untuk ${activeUsers.length} user dan ${allUrls.length} URL LPSE`
    };
  }

  async stop() {
    if (!this.isActive) {
      return { success: false, message: 'Monitoring tidak sedang berjalan!' };
    }

    this.isActive = false;
    if (this.scrapingInterval) {
      clearTimeout(this.scrapingInterval);
      this.scrapingInterval = null;
    }

    // Notify all users
    await this.notificationService.notifyMonitoringStop();

    return { success: true, message: 'Monitoring dihentikan' };
  }

  async startScrapingLoop() {
    console.log('Starting scraping loop...');
    
    // Simpan instance monitoringService ke global scope agar bisa diakses oleh keyboard
    global.monitoringServiceInstance = this;
    
    // Gunakan recursive timeout daripada while loop
    // Ini memastikan loop bisa dihentikan dengan benar
    const runScrapingCycle = async () => {
      // Jika monitoring sudah tidak aktif, hentikan loop
      if (!this.isActive) {
        console.log('Monitoring stopped, exiting scraping loop');
        return;
      }
      
      try {
        const activeUsers = this.dataManager.getActiveUsers();
        
        if (activeUsers.length === 0) {
          console.log('No active users with complete data');
          // Jadwalkan siklus berikutnya dengan setTimeout dan keluar dari fungsi ini
          this.scrapingInterval = setTimeout(() => runScrapingCycle(), config.ERROR_DELAY);
          return;
        }
        
        const allUrls = this.dataManager.loadUrlsFromFile();
        if (allUrls.length === 0) {
          console.log('No URLs found in links.txt');
          // Jadwalkan siklus berikutnya dengan setTimeout dan keluar dari fungsi ini
          this.scrapingInterval = setTimeout(() => runScrapingCycle(), config.ERROR_DELAY);
          return;
        }
        
        // Get all unique KBLIs from active users
        const allKbli = [...new Set(activeUsers.flatMap(user => user.kbliList))];
        
        // Scrape all URLs
        const scrapeResults = await this.scraper.scrapeMultipleUrls(allUrls, allKbli);
        
        // Check and notify each user
        for (const user of activeUsers) {
          await this.notificationService.checkAndNotify(scrapeResults, user);
        }
        
        console.log(`Scraping cycle completed. Found ${scrapeResults.length} total results. Waiting for next cycle...`);
        // Jadwalkan siklus berikutnya dengan setTimeout
        this.scrapingInterval = setTimeout(() => runScrapingCycle(), config.SCRAPING_INTERVAL);
        
      } catch (error) {
        console.error('Error in scraping loop:', error);
        // Jika terjadi error, tetap jadwalkan siklus berikutnya setelah delay
        this.scrapingInterval = setTimeout(() => runScrapingCycle(), config.ERROR_DELAY);
      }
    };
    
    // Mulai siklus pertama
    runScrapingCycle();
  }
  
  // Fungsi untuk mendapatkan status monitoring
  getStatus() {
    const stats = this.dataManager.getStats();
    
    return {
      isActive: this.isActive,
      ...stats
    };
  }
}

module.exports = MonitoringService;