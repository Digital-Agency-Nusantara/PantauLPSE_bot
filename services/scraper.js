// services/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/config');

class Scraper {
  constructor() {
    this.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrape(url, kbliList) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': config.USER_AGENT
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
    
    for (const url of urls) {
      console.log('Checking URL:', url);
      const results = await this.scrape(url, kbliList);
      allResults.push(...results);
      await this.delay(config.URL_DELAY);
    }
    
    return allResults;
  }
}

module.exports = Scraper;