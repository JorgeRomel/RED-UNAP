const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

const validateAndFormatPhone = (phoneNumber, defaultCountry = 'PE') => {
  try {
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    if (!isValidPhoneNumber(cleanNumber, defaultCountry)) {
      return {
        isValid: false,
        error: 'Número de teléfono inválido'
      };
    }

    const parsed = parsePhoneNumber(cleanNumber, defaultCountry);
    
    return {
      isValid: true,
      originalNumber: phoneNumber,
      formattedNumber: parsed.format('E.164'),
      internationalFormat: parsed.format('INTERNATIONAL'),
      nationalFormat: parsed.format('NATIONAL'),
      countryCode: parsed.countryCallingCode,
      country: parsed.country
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Error al procesar el número de teléfono: ' + error.message
    };
  }
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  validateAndFormatPhone,
  generateVerificationCode
};