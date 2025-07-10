const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
  console.warn('⚠️ Twilio no está configurado. Las notificaciones WhatsApp estarán deshabilitadas.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

const isConfigured = () => {
  return client !== null && process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true';
};

const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!isConfigured()) {
      throw new Error('Twilio no está configurado correctamente');
    }

    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    console.log(`📱 Enviando WhatsApp a ${formattedTo}: ${message.substring(0, 50)}...`);

    const messageResponse = await client.messages.create({
      body: message,
      from: whatsappNumber,
      to: formattedTo
    });

    console.log(`✅ WhatsApp enviado. SID: ${messageResponse.sid}`);
    
    return {
      success: true,
      sid: messageResponse.sid,
      status: messageResponse.status
    };

  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getMessageStatus = async (messageSid) => {
  try {
    if (!isConfigured()) {
      throw new Error('Twilio no está configurado correctamente');
    }

    const message = await client.messages(messageSid).fetch();
    
    return {
      success: true,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };

  } catch (error) {
    console.error('❌ Error obteniendo estado del mensaje:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  client,
  isConfigured,
  sendWhatsAppMessage,
  getMessageStatus,
  whatsappNumber
};