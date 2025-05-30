// services/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/config');

class Scraper {
  constructor() {
    this.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    this.shouldStop = false;
  }
  
  // Metode untuk menghentikan proses scraping
  stopScraping() {
    console.log('Stopping scraper...');
    this.shouldStop = true;
  }
  
  // Metode untuk mereset status stop
  resetStop() {
    this.shouldStop = false;
  }

  async scrape(url, kbliList) {
    try {
      // Periksa apakah scraping harus dihentikan
      if (this.shouldStop) {
        console.log('Scrape method interrupted by stop signal for URL:', url);
        return [];
      }
      
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': config.USER_AGENT
        }
      });
      
      // Periksa lagi setelah mendapatkan data
      if (this.shouldStop) {
        console.log('Scrape method interrupted after fetching data for URL:', url);
        return [];
      }
      
      const $ = cheerio.load(data);
      const tbody = $('tbody');
      let title = $('title');
      let namaInstansi = title.text().trim().split(' - ')[0];
      
      const rows = tbody.find('tr').toArray();
      const results = [];
      
      for (const element of rows) {
        // Periksa apakah scraping harus dihentikan dalam loop
        if (this.shouldStop) {
          console.log('Scrape loop interrupted by stop signal while processing rows for URL:', url);
          break;
        }
        
        const linkElement = $(element).find('td a');
        const hpsElement = $(element).find('td.table-hps');
        const tanggalAkhirElement = $(element).find('td.center');
        
        if (linkElement.length === 0 || hpsElement.length === 0 || tanggalAkhirElement.length === 0) {
          continue;
        }
        
        const linkpaket = linkElement.attr('href');
        const link = new URL(linkpaket, url).href;
        const namaPaket = linkElement.text().trim();
        console.log(`Berhasil scrape paket: ${namaPaket}`);
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
              'User-Agent': config.USER_AGENT,
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
        
        await this.delay(config.REQUEST_DELAY);
      }
      
      return results;
    } catch (error) {
      console.error(`Error saat melakukan scraping untuk ${url}:`, error);
      return [];
    }
  }

  async scrapeMultipleUrls(urls, kbliList) {
    const allResults = [];
    
    // Reset flag stop sebelum memulai
    this.resetStop();
    
    for (const url of urls) {
      // Periksa apakah scraping harus dihentikan
      if (this.shouldStop) {
        console.log('Scraping process interrupted by stop signal');
        break;
      }
      
      console.log('Checking URL:', url);
      const results = await this.scrape(url, kbliList);
      allResults.push(...results);
      
      // Periksa lagi apakah harus berhenti sebelum delay
      if (this.shouldStop) {
        console.log('Scraping process interrupted by stop signal after checking URL:', url);
        break;
      }
      
      await this.delay(config.URL_DELAY);
    }
    
    return allResults;
  }
}

module.exports = Scraper;