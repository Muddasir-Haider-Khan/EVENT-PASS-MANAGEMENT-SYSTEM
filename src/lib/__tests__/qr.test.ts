import { describe, it, expect } from 'vitest';
import { generateQRToken, generateQRCodeDataURL, generateGateOTP } from '../qr';

describe('QR Utilities', () => {
  it('should generate unguessable 64-character hex tokens', () => {
    const token1 = generateQRToken();
    const token2 = generateQRToken();
    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('should generate valid QR code data URLs', async () => {
    const token = generateQRToken();
    const dataUrl = await generateQRCodeDataURL(token);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should generate 6-character clean gate OTPs', () => {
    const otp = generateGateOTP();
    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
  });
});
