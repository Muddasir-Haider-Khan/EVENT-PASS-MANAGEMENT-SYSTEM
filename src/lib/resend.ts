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
  return process.env.RESEND_FROM_EMAIL || 'no-reply@27mediaagency.com';
}

async function safeSend(resend: Resend, emailData: { from: string; to: string; subject: string; html: string }) {
  let res = await resend.emails.send(emailData);
  if (res.error) {
    console.warn(`Resend email dispatch failed with sender "${emailData.from}":`, res.error);
    if (emailData.from !== 'onboarding@resend.dev') {
      console.info('Retrying email dispatch via fallback sender "onboarding@resend.dev"...');
      res = await resend.emails.send({
        ...emailData,
        from: 'onboarding@resend.dev',
      });
    }
  }
  if (res.error) {
    console.error('Final Resend error:', res.error);
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

  return safeSend(resend, {
    from: getFromEmail(),
    to: params.to,
    subject: `Your Event Pass — ${params.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#070709;font-family:'Segoe UI',system-ui,sans-serif;color:#F8FAFC;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="background:#0F0F14;border:1px solid rgba(212,175,55,0.3);border-radius:14px;padding:36px;text-align:center;">
              <h1 style="color:#F8FAFC;font-size:24px;font-weight:700;margin:0 0 6px;">
                You're In! 🎉
              </h1>
              <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">
                Your registration pass for <strong style="color:#D4AF37;">${params.eventName}</strong> is confirmed.
              </p>
              
              <div style="background:#fff;border-radius:14px;padding:20px;display:inline-block;margin:0 0 24px;">
                <img src="${params.qrDataUrl}" alt="QR Pass" style="width:200px;height:200px;display:block;" />
              </div>
              
              <div style="background:#070709;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:20px;text-align:left;margin:0 0 20px;">
                ${params.participantName ? `
                <div style="margin:0 0 10px;">
                  <span style="color:#D4AF37;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Guest Name</span>
                  <div style="color:#F8FAFC;font-size:15px;margin-top:2px;font-weight:600;">${params.participantName}</div>
                </div>` : ''}
                <div style="margin:0 0 10px;">
                  <span style="color:#D4AF37;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Venue</span>
                  <div style="color:#F8FAFC;font-size:15px;margin-top:2px;">${params.venue}</div>
                </div>
                ${dateStr ? `
                <div>
                  <span style="color:#D4AF37;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Date & Time</span>
                  <div style="color:#F8FAFC;font-size:15px;margin-top:2px;">${dateStr}</div>
                </div>` : ''}
              </div>
              
              <p style="color:#94A3B8;font-size:13px;margin:0;line-height:1.5;">
                Present this QR pass code at the entrance gate scanner.<br/>
                Save or screenshot this pass for immediate verification.
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
