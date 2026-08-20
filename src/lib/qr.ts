import QRCode from 'qrcode';
import { customAlphabet } from 'nanoid';
import crypto from 'crypto';

const gateOtpGenerator = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

/**
 * Generate a cryptographically random QR token.
 * 32 bytes of randomness → 64 hex chars = unguessable.
 */
export function generateQRToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a QR code as a data URL (base64 PNG).
 * The QR encodes only the token — participant details are looked up server-side.
 */
export async function generateQRCodeDataURL(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 400,
    color: {
      dark: '#0C0F14',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate a QR code as a Buffer (PNG).
 */
export async function generateQRCodeBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    errorCorrectionLevel: 'M',
    type: 'png',
    margin: 2,
    width: 400,
    color: {
      dark: '#0C0F14',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate a 6-character clean alphanumeric OTP for gate access.
 */
export function generateGateOTP(): string {
  return gateOtpGenerator();
}
