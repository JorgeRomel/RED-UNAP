const cron = require('node-cron');
const NotificationService = require('../services/notificationService');
const db = require('../config/database');

class CronJobs {
  
  static startJobs() {
    console.log('🕐 Iniciando trabajos programados...');
    cron.schedule('0 8 * * *', async () => {
      console.log('📅 Ejecutando resumen diario...');
      await NotificationService.sendDailySummary();
    });

    cron.schedule('0 * * * *', async () => {
      try {
        await db.execute(`
          UPDATE user_whatsapp 
          SET verification_code = NULL, verification_expires_at = NULL 
          WHERE verification_expires_at < NOW()
        `);
        console.log('🧹 Códigos de verificación expirados limpiados');
      } catch (error) {
        console.error('Error limpiando códigos expirados:', error);
      }
    });
    cron.schedule('0 2 * * 0', async () => {
      try {
        const [result] = await db.execute(`
          DELETE FROM notification_history 
          WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        console.log(`🗑️ Historial de notificaciones limpiado: ${result.affectedRows} registros`);
      } catch (error) {
        console.error('Error limpiando historial:', error);
      }
    });

    console.log('✅ Trabajos programados iniciados exitosamente');
  }
}

module.exports = CronJobs;