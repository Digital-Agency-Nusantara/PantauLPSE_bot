// services/notificationService.js
const config = require('../config/config');

class NotificationService {
  constructor(bot, dataManager) {
    this.bot = bot;
    this.dataManager = dataManager;
    this.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkAndNotify(scrapeResults, user) {
    for (const result of scrapeResults) {
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
          const detailPaket = this.formatTenderNotification({
            namaInstansi,
            link,
            namaPaket,
            jenisPengadaan,
            kodeTender,
            matchedKbli,
            hps,
            tanggalAkhir,
            finalMatchKbli,
            finalMatchKeyword
          });
          
          try {
            await this.bot.sendMessage(user.chatId, detailPaket);
            this.dataManager.addSentTender(user.chatId, kodeTender);
            console.log(`Notifikasi dikirim ke ${user.name} untuk tender ${kodeTender}`);
          } catch (error) {
            console.error(`Error mengirim notifikasi ke ${user.name}:`, error);
          }
          
          await this.delay(1000);
        }
      }
    }
  }

  formatTenderNotification({
    namaInstansi,
    link,
    namaPaket,
    jenisPengadaan,
    kodeTender,
    matchedKbli,
    hps,
    tanggalAkhir,
    finalMatchKbli,
    finalMatchKeyword
  }) {
    return '🎯 TENDER NOTIFICATION 🎯\n\n' +
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
  }

  async broadcastToAllUsers(message) {
    const users = this.dataManager.getAllUsers();
    let sentCount = 0;
    
    for (const userId of Object.keys(users)) {
      try {
        await this.bot.sendMessage(userId, message);
        sentCount++;
        await this.delay(100); // Small delay to avoid rate limits
      } catch (error) {
        console.error(`Failed to send message to ${userId}:`, error);
      }
    }
    
    return sentCount;
  }

  async notifyMonitoringStart(totalUrls) {
    const message = `🚀 Monitoring tender dimulai! Anda akan mendapat notifikasi jika ada tender yang sesuai.\n\n📊 Monitoring ${totalUrls} URL LPSE`;
    return await this.broadcastToAllUsers(message);
  }

  async notifyMonitoringStop() {
    const message = '⏹️ Monitoring tender dihentikan.';
    return await this.broadcastToAllUsers(message);
  }
}

module.exports = NotificationService;