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
  qrImageUrl: string;
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

  const attachments: Array<{ filename: string; content?: Buffer; path?: string; content_id?: string }> = [];

  if (params.qrImageUrl.startsWith('http://') || params.qrImageUrl.startsWith('https://')) {
    attachments.push({
      filename: 'event-pass-qr.png',
      path: params.qrImageUrl,
    });
  } else if (params.qrImageUrl.startsWith('data:image')) {
    const base64Data = params.qrImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');
    attachments.push({
      filename: 'event-pass-qr.png',
      content: qrBuffer,
    });
  }

  return safeSend(resend, {
    from: getFromEmail(),
    to: params.to,
    subject: `Your Event Pass — ${params.eventName}`,
    ...(attachments.length > 0 ? { attachments } : {}),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your Event Pass</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                  <tr>
                    <td>
                      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                        Greetings ${params.participantName ? params.participantName : 'Participant'},
                      </h2>
                      
                      <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569;">
                        Your registration for <strong>${params.eventName}</strong> has been approved. Below is your official entry pass and QR code.
                      </p>

                      <!-- Event Info Table -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding-bottom: 8px; font-size: 14px; color: #334155;">
                            <strong>Event Name:</strong> ${params.eventName}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: ${dateStr ? '8px' : '0px'}; font-size: 14px; color: #334155;">
                            <strong>Venue:</strong> ${params.venue}
                          </td>
                        </tr>
                        ${dateStr ? `
                        <tr>
                          <td style="font-size: 14px; color: #334155;">
                            <strong>Date & Time:</strong> ${dateStr}
                          </td>
                        </tr>` : ''}
                      </table>

                      <!-- QR Code Box -->
                      <div style="text-align: center; margin: 24px 0;">
                        <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                          Your Entry QR Pass Code
                        </div>
                        <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                          <tr>
                            <td align="center" style="background-color: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #cbd5e1;">
                              <img src="${params.qrImageUrl}" alt="Event QR Pass Code" width="200" height="200" style="display: block; width: 200px; height: 200px; border: 0;" />
                            </td>
                          </tr>
                        </table>
                      </div>

                      <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; text-align: center;">
                        Please save or screenshot this QR code pass and present it at the entrance gate scanner.
                      </p>
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
