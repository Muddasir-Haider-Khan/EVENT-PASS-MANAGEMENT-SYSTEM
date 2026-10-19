// Every call to action on the page opens a WhatsApp chat with 27 Media.
export const WHATSAPP_NUMBER = '923001526303';
export const WHATSAPP_DISPLAY = '0300 1526303';

export const SITE_URL = 'https://epmsinfo.27mediaagency.com';
export const APP_URL = 'https://epms.27mediaagency.com';

export type Audience = 'mun' | 'enterprise';

const DEFAULT_MESSAGES: Record<Audience | 'general', string> = {
  general: "Hi 27 Media, I'd like to know more about EPMS for my event.",
  mun: "Hi 27 Media, we're organising a MUN conference and want EPMS digital passes for our delegates.",
  enterprise: "Hi 27 Media, I'm planning an event and want to discuss EPMS for registration and gate entry.",
};

export function whatsappLink(message: string = DEFAULT_MESSAGES.general) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function audienceLink(audience: Audience | 'general') {
  return whatsappLink(DEFAULT_MESSAGES[audience]);
}
