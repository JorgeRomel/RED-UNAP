const db = require('../config/database');
const { sendWhatsAppMessage, isConfigured } = require('../config/twilio');
const { validateAndFormatPhone, generateVerificationCode } = require('../utils/phoneValidator');
const Joi = require('joi');
const registerPhoneSchema = Joi.object({
  phone_number: Joi.string().required().messages({
    'any.required': 'El número de teléfono es requerido'
  }),
  country_code: Joi.string().optional().default('+1')
});

const verifyPhoneSchema = Joi.object({
  verification_code: Joi.string().length(6).required().messages({
    'string.length': 'El código debe tener 6 dígitos',
    'any.required': 'El código de verificación es requerido'
  })
});

const updatePreferencesSchema = Joi.object({
  notifications: Joi.object().pattern(
    Joi.string(),
    Joi.boolean()
  ).required()
});

class WhatsAppController {
  static async registerPhoneNumber(req, res, next) {
    try {
      if (!isConfigured()) {
        return res.status(503).json({
          error: 'Las notificaciones WhatsApp están temporalmente deshabilitadas'
        });
      }
      const { error, value } = registerPhoneSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.details.map(detail => detail.message)
        });
      }

      const { phone_number, country_code } = value;
      const userId = req.user.id;
      const phoneValidation = validateAndFormatPhone(phone_number);
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          error: phoneValidation.error
        });
      }

      const formattedNumber = phoneValidation.formattedNumber;
      const [existingPhone] = await db.execute(
        'SELECT id, is_verified FROM user_whatsapp WHERE user_id = ?',
        [userId]
      );

      const verificationCode = generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      if (existingPhone.length > 0) {
        await db.execute(`
          UPDATE user_whatsapp 
          SET phone_number = ?, formatted_number = ?, country_code = ?, 
              verification_code = ?, verification_expires_at = ?, 
              is_verified = FALSE, updated_at = NOW()
          WHERE user_id = ?
        `, [phone_number, formattedNumber, country_code, verificationCode, expiresAt, userId]);
      } else {
        await db.execute(`
          INSERT INTO user_whatsapp 
          (user_id, phone_number, formatted_number, country_code, verification_code, verification_expires_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, phone_number, formattedNumber, country_code, verificationCode, expiresAt]);
        await WhatsAppController.createDefaultPreferences(userId);
      }

      const message = `🔐 Tu código de verificación para RED UNAP es: ${verificationCode}\n\nEste código expira en 10 minutos.`;
      const messageResult = await sendWhatsAppMessage(formattedNumber, message);
      
      if (!messageResult.success) {
        return res.status(500).json({
          error: 'Error al enviar código de verificación',
          details: messageResult.error
        });
      }
      await WhatsAppController.logNotification(
        userId, 4, formattedNumber, message, messageResult.sid
      );

      res.json({
        message: 'Código de verificación enviado por WhatsApp',
        phone_number: phoneValidation.internationalFormat,
        expires_in_minutes: 10
      });

    } catch (error) {
      console.error('Error en registerPhoneNumber:', error);
      next(error);
    }
  }

  static async verifyPhoneNumber(req, res, next) {
    try {
      const { error, value } = verifyPhoneSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.details.map(detail => detail.message)
        });
      }

      const { verification_code } = value;
      const userId = req.user.id;
      const [phoneRecord] = await db.execute(`
        SELECT id, phone_number, formatted_number, verification_code, verification_expires_at
        FROM user_whatsapp 
        WHERE user_id = ? AND verification_code = ? AND verification_expires_at > NOW()
      `, [userId, verification_code]);

      if (phoneRecord.length === 0) {
        return res.status(400).json({
          error: 'Código de verificación inválido o expirado'
        });
      }

      await db.execute(`
        UPDATE user_whatsapp 
        SET is_verified = TRUE, verification_code = NULL, verification_expires_at = NULL, updated_at = NOW()
        WHERE user_id = ?
      `, [userId]);

      const welcomeMessage = `🎉 ¡Bienvenido a RED UNAP!\n\nTu número de WhatsApp ha sido verificado exitosamente. Ahora recibirás notificaciones sobre nuevas historias y actualizaciones.\n\n📱 Puedes gestionar tus preferencias de notificación desde tu perfil.`;
      
      const messageResult = await sendWhatsAppMessage(phoneRecord[0].formatted_number, welcomeMessage);
      
      if (messageResult.success) {
        await WhatsAppController.logNotification(
          userId, 3, phoneRecord[0].formatted_number, welcomeMessage, messageResult.sid
        );
      }

      res.json({
        message: 'Número de WhatsApp verificado exitosamente',
        phone_number: phoneRecord[0].phone_number,
        notifications_enabled: true
      });

    } catch (error) {
      console.error('Error en verifyPhoneNumber:', error);
      next(error);
    }
  }

  static async getNotificationStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const [whatsappInfo] = await db.execute(`
        SELECT phone_number, formatted_number, is_verified, is_active, created_at
        FROM user_whatsapp 
        WHERE user_id = ?
      `, [userId]);
      const [preferences] = await db.execute(`
        SELECT nt.name, nt.description, unp.is_enabled
        FROM notification_types nt
        LEFT JOIN user_notification_preferences unp ON nt.id = unp.notification_type_id AND unp.user_id = ?
        WHERE nt.is_active = TRUE AND nt.name != 'verification'
        ORDER BY nt.name
      `, [userId]);
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as total_delivered,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed
        FROM notification_history 
        WHERE user_id = ?
      `, [userId]);

      const hasWhatsApp = whatsappInfo.length > 0;
      const isVerified = hasWhatsApp && whatsappInfo[0].is_verified;

      res.json({
        whatsapp_registered: hasWhatsApp,
        whatsapp_verified: isVerified,
        phone_number: hasWhatsApp ? whatsappInfo[0].phone_number : null,
        notifications_enabled: isConfigured(),
        preferences: preferences.map(pref => ({
          type: pref.name,
          description: pref.description,
          enabled: pref.is_enabled !== null ? pref.is_enabled : true
        })),
        statistics: stats[0] || { total_sent: 0, total_delivered: 0, total_failed: 0 }
      });

    } catch (error) {
      console.error('Error en getNotificationStatus:', error);
      next(error);
    }
  }
  static async updateNotificationPreferences(req, res, next) {
    try {
      const { error, value } = updatePreferencesSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.details.map(detail => detail.message)
        });
      }

      const { notifications } = value;
      const userId = req.user.id;
      const [whatsappInfo] = await db.execute(
        'SELECT is_verified FROM user_whatsapp WHERE user_id = ?',
        [userId]
      );

      if (whatsappInfo.length === 0 || !whatsappInfo[0].is_verified) {
        return res.status(400).json({
          error: 'Debes verificar tu número de WhatsApp antes de configurar preferencias'
        });
      }

      for (const [notificationType, enabled] of Object.entries(notifications)) {
        const [typeInfo] = await db.execute(
          'SELECT id FROM notification_types WHERE name = ? AND is_active = TRUE',
          [notificationType]
        );

        if (typeInfo.length > 0) {
          const typeId = typeInfo[0].id;

          await db.execute(`
            INSERT INTO user_notification_preferences (user_id, notification_type_id, is_enabled)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_enabled = ?, updated_at = NOW()
          `, [userId, typeId, enabled, enabled]);
        }
      }

      res.json({
        message: 'Preferencias de notificación actualizadas exitosamente',
        preferences: notifications
      });

    } catch (error) {
      console.error('Error en updateNotificationPreferences:', error);
      next(error);
    }
  }

  static async removePhoneNumber(req, res, next) {
    try {
      const userId = req.user.id;
      const [whatsappInfo] = await db.execute(
        'SELECT formatted_number FROM user_whatsapp WHERE user_id = ?',
        [userId]
      );

      if (whatsappInfo.length === 0) {
        return res.status(404).json({
          error: 'No tienes un número de WhatsApp registrado'
        });
      }

      if (isConfigured()) {
        const goodbyeMessage = `👋 Has desactivado las notificaciones de WhatsApp para RED UNAP.\n\nPuedes volver a activarlas cuando quieras desde tu perfil.`;
        await sendWhatsAppMessage(whatsappInfo[0].formatted_number, goodbyeMessage);
      }

      await db.execute('DELETE FROM user_whatsapp WHERE user_id = ?', [userId]);

      res.json({
        message: 'Número de WhatsApp eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error en removePhoneNumber:', error);
      next(error);
    }
  }
  static async twilioWebhook(req, res) {
    try {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

      console.log('📱 Webhook de Twilio:', { MessageSid, MessageStatus, ErrorCode });

      if (MessageSid) {
        const updateData = [MessageStatus];
        let updateQuery = 'UPDATE notification_history SET status = ?, updated_at = NOW()';

        if (MessageStatus === 'delivered') {
          updateQuery += ', delivered_at = NOW()';
        }

        if (ErrorCode) {
          updateQuery += ', error_message = ?';
          updateData.push(ErrorMessage || `Error code: ${ErrorCode}`);
        }

        updateQuery += ' WHERE twilio_sid = ?';
        updateData.push(MessageSid);

        await db.execute(updateQuery, updateData);
      }

      res.status(200).send('OK');

    } catch (error) {
      console.error('Error en twilioWebhook:', error);
      res.status(200).send('OK');
    }
  }

  static async createDefaultPreferences(userId) {
    try {
      const [notificationTypes] = await db.execute(
        'SELECT id FROM notification_types WHERE is_active = TRUE AND name != "verification"'
      );

      for (const type of notificationTypes) {
        await db.execute(`
          INSERT IGNORE INTO user_notification_preferences (user_id, notification_type_id, is_enabled)
          VALUES (?, ?, TRUE)
        `, [userId, type.id]);
      }
    } catch (error) {
      console.error('Error creando preferencias por defecto:', error);
    }
  }

  static async logNotification(userId, notificationTypeId, phoneNumber, message, twilioSid = null) {
    try {
      await db.execute(`
        INSERT INTO notification_history 
        (user_id, notification_type_id, phone_number, message, twilio_sid, status, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [userId, notificationTypeId, phoneNumber, message, twilioSid, twilioSid ? 'sent' : 'failed']);
    } catch (error) {
      console.error('Error registrando notificación:', error);
    }
  }

  static async sendNotificationToSubscribers(notificationType, message, excludeUserId = null) {
    try {
      console.log(`📱 === ENVIANDO NOTIFICACIONES ===`);
      console.log(`Tipo: ${notificationType}`);
      console.log(`Mensaje: ${message.substring(0, 50)}...`);
      console.log(`Excluir usuario: ${excludeUserId || 'Ninguno'}`);
      
      if (!isConfigured()) {
        console.log('⚠️ Twilio no está configurado - omitiendo envío');
        return { sent: 0, failed: 0 };
      }

      let query = `
        SELECT 
          uw.user_id,
          uw.formatted_number,
          u.username,
          nt.id as notification_type_id
        FROM user_whatsapp uw
        JOIN users u ON uw.user_id = u.id
        JOIN notification_types nt ON nt.name = ?
        LEFT JOIN user_notification_preferences unp ON uw.user_id = unp.user_id AND nt.id = unp.notification_type_id
        WHERE uw.is_verified = 1 
          AND uw.is_active = 1
          AND u.is_active = 1
          AND (unp.is_enabled IS NULL OR unp.is_enabled = 1)
      `;

      const queryParams = [notificationType];

      if (excludeUserId) {
        query += ' AND uw.user_id != ?';
        queryParams.push(excludeUserId);
      }
      
      console.log(`📋 Query: ${query}`);
      console.log(`📋 Params: ${JSON.stringify(queryParams)}`);

      const [subscribers] = await db.execute(query, queryParams);
      
      console.log(`👥 Suscriptores encontrados: ${subscribers.length}`);
      
      if (subscribers.length === 0) {
        console.log('⚠️ No hay usuarios suscritos a este tipo de notificación');
        return { sent: 0, failed: 0 };
      }

      subscribers.forEach(sub => {
        console.log(`  - ${sub.username}: ${sub.formatted_number}`);
      });

      let sent = 0;
      let failed = 0;

      for (const subscriber of subscribers) {
        console.log(`📤 Enviando a ${subscriber.username} (${subscriber.formatted_number})...`);
        
        const messageResult = await sendWhatsAppMessage(subscriber.formatted_number, message);
        
        if (messageResult.success) {
          sent++;
          console.log(`  ✅ Exitoso - SID: ${messageResult.sid}`);
          await WhatsAppController.logNotification(
            subscriber.user_id,
            subscriber.notification_type_id,
            subscriber.formatted_number,
            message,
            messageResult.sid
          );
        } else {
          failed++;
          console.log(`  ❌ Fallido - Error: ${messageResult.error}`);
          await WhatsAppController.logNotification(
            subscriber.user_id,
            subscriber.notification_type_id,
            subscriber.formatted_number,
            message,
            null
          );
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`📊 Resultado final: ${sent} exitosas, ${failed} fallidas`);
      return { sent, failed };

    } catch (error) {
      console.error('❌ Error enviando notificaciones masivas:', error);
      return { sent: 0, failed: 0 };
    }
  }
}

module.exports = WhatsAppController;