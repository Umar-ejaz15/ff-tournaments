// WhatsApp integration disabled — replaced with safe no-op stubs
// This file intentionally avoids calling external WhatsApp providers.
// If you need WhatsApp later, reintroduce provider code behind a feature flag.

export interface WhatsAppMessage {
  to: string;
  message: string;
}

/**
 * Stubbed send function — returns false and logs if attempted.
 */
export async function sendWhatsAppMessage(_: WhatsAppMessage): Promise<boolean> {
  console.warn("sendWhatsAppMessage called but WhatsApp integration is disabled.");
  return false;
}

/**
 * Basic phone formatter — keeps behaviour minimal for any existing callers.
 */
export function formatPhoneNumber(phone: string, countryCode: string = "+92"): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return countryCode;
  if (digits.startsWith("0")) return `${countryCode}${digits.substring(1)}`;
  if (digits.startsWith(countryCode.replace("+", ""))) return `+${digits}`;
  return `${countryCode}${digits}`;
}

