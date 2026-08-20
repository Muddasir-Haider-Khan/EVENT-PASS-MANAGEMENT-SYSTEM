import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (resendInstance) return resendInstance;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  resendInstance = new Resend(apiKey);
  return resendInstance;
}

function getFromEmail(): string {
  const envFrom = process.env.RESEND_FROM_EMAIL;
  if (envFrom && !envFrom.includes('epms.27mediaagency.com') && !envFrom.includes('resend.dev')) {
    return envFrom;
  }
  return 'no-reply@27mediaagency.com';
}

async function safeSend(
  resend: Resend,
  emailData: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content?: Buffer | string; path?: string; content_id?: string }>;
  }
) {
  const fromEmail = getFromEmail();
  const res = await resend.emails.send({
    ...emailData,
    from: fromEmail,
  });

  if (res.error) {
    console.error(`Resend email dispatch error (${fromEmail} -> ${emailData.to}):`, res.error);
    throw new Error(res.error.message || 'Resend email dispatch failed');
  }
  return res.data;
}

/**
 * Send event manager credentials email
 */
export async function sendManagerCredentials(params: {
  to: string;
  eventName: string;
  loginId: string;
  password: string;
  loginUrl: string;
}) {
  const resend = getResend();

  return safeSend(resend, {
    from: getFromEmail(),
    to: params.to,
    subject: `Your Event Manager Credentials — ${params.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#070709;font-family:'Segoe UI',system-ui,sans-serif;color:#F8FAFC;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="background:#0F0F14;border:1px solid rgba(212,175,55,0.3);border-radius:14px;padding:36px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#AA7C11);color:#070709;font-weight:700;font-size:12px;padding:4px 12px;border-radius:100px;text-transform:uppercase;letter-spacing:0.1em;">
                  27 MEDIA AGENCY • EVENT PORTAL
                </span>
              </div>

              <h1 style="color:#F8FAFC;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">
                Event Manager Access Granted
              </h1>
              <p style="color:#94A3B8;font-size:14px;margin:0 0 28px;text-align:center;">
                You have been provisioned as the Official Event Manager for <strong style="color:#D4AF37;">${params.eventName}</strong>.
              </p>
              
              <div style="background:#070709;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:24px;margin:0 0 28px;">
                <div style="margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <span style="color:#D4AF37;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Manager Login ID</span>
                  <div style="color:#F8FAFC;font-size:18px;font-family:monospace;margin-top:4px;font-weight:700;">${params.loginId}</div>
                </div>
                <div>
                  <span style="color:#D4AF37;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Permanent System Password</span>
                  <div style="color:#F8FAFC;font-size:18px;font-family:monospace;margin-top:4px;font-weight:700;">${params.password}</div>
                </div>
              </div>
              
              <div style="text-align:center;">
                <a href="${params.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#AA7C11);color:#070709;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:700;">
                  Log In to Event Dashboard →
                </a>
              </div>
              
              <p style="color:#94A3B8;font-size:12px;margin:24px 0 0;padding:12px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);border-radius:8px;text-align:center;">
                ℹ️ This password is your permanent system-generated key for accessing your event panel.
              </p>
            </div>
            
            <p style="color:#64748B;font-size:12px;text-align:center;margin:20px 0 0;">
              © ${new Date().getFullYear()} 27 MEDIA AGENCY — Event Pass Management System
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send QR pass email to approved participant
 */
export async function sendQRPass(params: {
  to: string;
  participantName: string;
  eventName: string;
  venue: string;
  eventDate?: string | null;
  qrDataUrl: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  const resend = getResend();

  const dateStr = params.eventDate
    ? new Date(params.eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Extract base64 buffer for inline CID attachment (Gmail/Outlook compatible)
  const base64Data = params.qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const qrBuffer = Buffer.from(base64Data, 'base64');

  return safeSend(resend, {
    from: getFromEmail(),
    to: params.to,
    subject: `Your Official Event Pass — ${params.eventName}`,
    attachments: [
      {
        filename: 'event-pass-qr.png',
        content: qrBuffer,
        content_id: 'qr-code',
      },
    ],
    html: `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your Official Event Pass</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070709; padding: 32px 16px;">
            <tr>
              <td align="center">
                <!-- Pass Container Card -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #0F0F14; border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                  
                  <!-- Header Branding Bar -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #181824 0%, #0D0D12 100%); padding: 24px 28px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <div style="font-size: 11px; font-weight: 700; color: #D4AF37; letter-spacing: 2px; text-transform: uppercase;">
                              OFFICIAL EVENT PASS
                            </div>
                            <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-top: 4px; line-height: 1.2;">
                              ${params.eventName}
                            </div>
                          </td>
                          <td align="right" valign="top">
                            <span style="display: inline-block; background: rgba(212, 175, 55, 0.15); border: 1px solid #D4AF37; color: #F5E6AD; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
                              CONFIRMED
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Pass Card Body -->
                  <tr>
                    <td style="padding: 32px 28px; text-align: center;">
                      
                      <div style="font-size: 14px; color: #94A3B8; margin-bottom: 20px;">
                        Show this pass at the entrance gate scanner for entry
                      </div>

                      <!-- High-Contrast White QR Box -->
                      <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
                        <tr>
                          <td align="center" style="background-color: #FFFFFF; padding: 18px; border-radius: 16px; border: 2px solid #D4AF37; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.25);">
                            <img src="${params.qrDataUrl}" alt="Event QR Pass Code" width="210" height="210" style="display: block; width: 210px; height: 210px; border: 0; outline: none; text-decoration: none;" />
                          </td>
                        </tr>
                      </table>

                      <!-- Participant Details Grid -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #070709; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; text-align: left;">
                        ${params.participantName ? `
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <div style="font-size: 10px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px;">PASS HOLDER</div>
                            <div style="font-size: 16px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">${params.participantName}</div>
                          </td>
                        </tr>` : ''}
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <div style="font-size: 10px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px;">VENUE</div>
                            <div style="font-size: 14px; font-weight: 600; color: #E2E8F0; margin-top: 2px;">${params.venue}</div>
                          </td>
                        </tr>
                        ${dateStr ? `
                        <tr>
                          <td>
                            <div style="font-size: 10px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px;">DATE & TIME</div>
                            <div style="font-size: 14px; font-weight: 600; color: #E2E8F0; margin-top: 2px;">${dateStr}</div>
                          </td>
                        </tr>` : ''}
                      </table>

                      <!-- Instructions -->
                      <div style="font-size: 12px; color: #64748B; margin-top: 20px; line-height: 1.5;">
                        🔒 Cryptographically verified event pass. Save or screenshot this ticket for fast gate verification.
                      </div>

                    </td>
                  </tr>

                  <!-- Footer Bar -->
                  <tr>
                    <td style="background-color: #0B0B0F; padding: 16px 28px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; font-size: 11px; color: #475569;">
                      © ${new Date().getFullYear()} <strong>27 MEDIA AGENCY</strong> — Event Pass Management System
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

/**
 * Send decline notification email
 */
export async function sendDeclineNotice(params: {
  to: string;
  eventName: string;
}) {
  const resend = getResend();

  return safeSend(resend, {
    from: getFromEmail(),
    to: params.to,
    subject: `Registration Update — ${params.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="margin:0;padding:0;background:#070709;font-family:'Segoe UI',system-ui,sans-serif;color:#F8FAFC;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="background:#0F0F14;border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:32px;">
              <h1 style="color:#F8FAFC;font-size:20px;font-weight:600;margin:0 0 12px;">
                Registration Update
              </h1>
              <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0;">
                We're sorry, but your registration for <strong style="color:#F8FAFC;">${params.eventName}</strong> 
                could not be approved at this time. If you believe this is an error, please contact the event organizer.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
