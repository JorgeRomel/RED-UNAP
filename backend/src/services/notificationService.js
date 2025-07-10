const WhatsAppController = require('../controllers/whatsappController');
const db = require('../config/database');

class NotificationService {
  static async sendWelcomeNotification(userId, username) {
    try {
      const message = `🎉 ¡Bienvenido a News Platform, ${username}!\n\nGracias por registrarte. Mantente al día con las últimas noticias y no olvides configurar tus notificaciones WhatsApp para no perderte nada.\n\n📱 ¡Disfruta de la experiencia!`;
      
      const [whatsappInfo] = await db.execute(
        'SELECT formatted_number FROM user_whatsapp WHERE user_id = ? AND is_verified = TRUE',
        [userId]
      );

      if (whatsappInfo.length > 0) {
        await WhatsAppController.sendNotificationToSubscribers('welcome', message);
      }

    } catch (error) {
      console.error('Error enviando notificación de bienvenida:', error);
    }
  }

  static async sendDailySummary() {
    try {
      const [recentStories] = await db.execute(`
        SELECT s.title, s.summary, c.name as category, u.username as author
        FROM stories s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.is_published = 1 
          AND s.published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY s.published_at DESC
        LIMIT 5
      `);

      if (recentStories.length === 0) {
        console.log('📱 No hay historias nuevas para el resumen diario');
        return;
      }

      let summaryMessage = `📅 *Resumen Diario - News Platform*\n\n`;
      summaryMessage += `🗞️ Nuevas historias publicadas hoy (${recentStories.length}):\n\n`;

      recentStories.forEach((story, index) => {
        summaryMessage += `${index + 1}. *${story.title}*\n`;
        if (story.category) summaryMessage += `   📂 ${story.category}\n`;
        if (story.author) summaryMessage += `   ✍️ ${story.author}\n`;
        summaryMessage += `\n`;
      });

      summaryMessage += `📱 Ingresa a News Platform para leer todas las historias completas.`;

      const result = await WhatsAppController.sendNotificationToSubscribers('system', summaryMessage);
      console.log(`📱 Resumen diario enviado: ${result.sent} usuarios`);

    } catch (error) {
      console.error('Error enviando resumen diario:', error);
    }
  }

  static async sendTrendingStoryNotification(storyId) {
    try {
      const [story] = await db.execute(`
        SELECT s.title, s.summary, c.name as category, u.username as author
        FROM stories s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.id = ? AND s.is_published = 1
      `, [storyId]);

      if (story.length === 0) {
        return;
      }

      const storyData = story[0];
      const message = `🔥 *Historia Trending*\n\n📰 ${storyData.title}\n\n${storyData.summary || 'Esta historia está siendo muy leída por la comunidad'}\n\n📱 ¡No te la pierdas!`;

      await WhatsAppController.sendNotificationToSubscribers('system', message);

    } catch (error) {
      console.error('Error enviando notificación de trending:', error);
    }
  }

  static scheduleNotifications() {
    const dailySummaryTime = new Date();
    dailySummaryTime.setHours(8, 0, 0, 0);
    
    if (dailySummaryTime < new Date()) {
      dailySummaryTime.setDate(dailySummaryTime.getDate() + 1);
    }

    const timeUntilSummary = dailySummaryTime.getTime() - new Date().getTime();
    
    setTimeout(() => {
      NotificationService.sendDailySummary();
      setInterval(NotificationService.sendDailySummary, 24 * 60 * 60 * 1000);
    }, timeUntilSummary);

    console.log(`📅 Resumen diario programado para: ${dailySummaryTime.toLocaleString()}`);
  }
}

module.exports = NotificationService;