/**
 * WhatsApp Bot Integration
 * Handles sending WhatsApp messages for match reminders
 * 
 * Supports multiple providers:
 * - Twilio WhatsApp API (recommended for production)
 * - WhatsApp Business API
 * - whatsapp-web.js (for development/testing)
 */

export interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (e.g., +923001234567)
  message: string;
}

export interface WhatsAppConfig {
  provider: 'twilio' | 'whatsapp-business' | 'whatsapp-web';
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  whatsappBusinessToken?: string;
  whatsappBusinessPhoneId?: string;
}

/**
 * Send WhatsApp message using Twilio
 */
async function sendViaTwilio(
  message: WhatsAppMessage,
  config: WhatsAppConfig
): Promise<boolean> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioWhatsAppNumber) {
    throw new Error('Twilio credentials not configured');
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${config.twilioAccountSid}:${config.twilioAuthToken}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: `whatsapp:${config.twilioWhatsAppNumber}`,
          To: `whatsapp:${message.to}`,
          Body: message.message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    return true;
  } catch (error) {
    console.error('Twilio WhatsApp error:', error);
    return false;
  }
}

/**
 * Send WhatsApp message using WhatsApp Business API
 */
async function sendViaWhatsAppBusiness(
  message: WhatsAppMessage,
  config: WhatsAppConfig
): Promise<boolean> {
  if (!config.whatsappBusinessToken || !config.whatsappBusinessPhoneId) {
    throw new Error('WhatsApp Business credentials not configured');
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.whatsappBusinessPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.whatsappBusinessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to.replace('+', ''),
          type: 'text',
          text: { body: message.message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp Business API error: ${error}`);
    }

    return true;
  } catch (error) {
    console.error('WhatsApp Business API error:', error);
    return false;
  }
}

/**
 * Main function to send WhatsApp message
 */
export async function sendWhatsAppMessage(
  message: WhatsAppMessage,
  config?: WhatsAppConfig
): Promise<boolean> {
  const defaultConfig: WhatsAppConfig = {
    provider: (process.env.WHATSAPP_PROVIDER as any) || 'twilio',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    whatsappBusinessToken: process.env.WHATSAPP_BUSINESS_TOKEN,
    whatsappBusinessPhoneId: process.env.WHATSAPP_BUSINESS_PHONE_ID,
  };

  const finalConfig = config || defaultConfig;

  switch (finalConfig.provider) {
    case 'twilio':
      return sendViaTwilio(message, finalConfig);
    case 'whatsapp-business':
      return sendViaWhatsAppBusiness(message, finalConfig);
    default:
      console.warn('WhatsApp provider not configured or unsupported');
      return false;
  }
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+92'): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 0, replace with country code
  if (digits.startsWith('0')) {
    return `${countryCode}${digits.substring(1)}`;
  }
  
  // If it doesn't start with country code, add it
  if (!digits.startsWith(countryCode.replace('+', ''))) {
    return `${countryCode}${digits}`;
  }
  
  return `+${digits}`;
}

