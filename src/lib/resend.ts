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
  return process.env.RESEND_FROM_EMAIL || 'no-reply@epms.27mediaagency.com';
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

  return resend.emails.send({
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
        <body style="margin:0;padding:0;background:#0C0F14;font-family:'Segoe UI',system-ui,sans-serif;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="background:#161A22;border:1px solid #1E2330;border-radius:12px;padding:32px;">
              <h1 style="color:#F8FAFC;font-size:20px;font-weight:600;margin:0 0 8px;">
                Event Manager Access
              </h1>
              <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">
                You've been assigned to manage <strong style="color:#F8FAFC;">${params.eventName}</strong>
              </p>
              
              <div style="background:#0C0F14;border-radius:8px;padding:20px;margin:0 0 24px;">
                <div style="margin:0 0 12px;">
                  <span style="color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Login ID</span>
                  <div style="color:#F8FAFC;font-size:16px;font-family:monospace;margin-top:4px;">${params.loginId}</div>
                </div>
                <div>
                  <span style="color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Temporary Password</span>
                  <div style="color:#F8FAFC;font-size:16px;font-family:monospace;margin-top:4px;">${params.password}</div>
                </div>
              </div>
              
              <a href="${params.loginUrl}" style="display:inline-block;background:#3B82F6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
                Log In Now →
              </a>
              
              <p style="color:#F59E0B;font-size:13px;margin:20px 0 0;padding:12px;background:rgba(245,158,11,0.1);border-radius:6px;">
                ⚠ You will be required to change your password on first login.
              </p>
            </div>
            
            <p style="color:#475569;font-size:12px;text-align:center;margin:16px 0 0;">
              Event Pass Management System — 27 Media Agency
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

  return resend.emails.send({
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
        <body style="margin:0;padding:0;background:#0C0F14;font-family:'Segoe UI',system-ui,sans-serif;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="background:#161A22;border:1px solid #1E2330;border-radius:12px;padding:32px;text-align:center;">
              <h1 style="color:#F8FAFC;font-size:22px;font-weight:600;margin:0 0 4px;">
                You're In! 🎉
              </h1>
              <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">
                Your registration for <strong style="color:#F8FAFC;">${params.eventName}</strong> has been approved.
              </p>
              
              <div style="background:#fff;border-radius:12px;padding:20px;display:inline-block;margin:0 0 24px;">
                <img src="${params.qrDataUrl}" alt="QR Pass" style="width:200px;height:200px;" />
              </div>
              
              <div style="background:#0C0F14;border-radius:8px;padding:16px;text-align:left;margin:0 0 20px;">
                ${params.participantName ? `
                <div style="margin:0 0 8px;">
                  <span style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Name</span>
                  <div style="color:#F8FAFC;font-size:15px;margin-top:2px;">${params.participantName}</div>
                </div>` : ''}
                <div style="margin:0 0 8px;">
                  <span style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Venue</span>
                  <div style="color:#F8FAFC;font-size:15px;margin-top:2px;">${params.venue}</div>
                </div>
                ${dateStr ? `
                <div>
                  <span style="color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Date</span>
                  <div style="color:#F8FAFC;font-size:15px;margin-top:2px;">${dateStr}</div>
                </div>` : ''}
              </div>
              
              <p style="color:#94A3B8;font-size:13px;margin:0;line-height:1.5;">
                Present this QR code at the gate for entry.<br/>
                Save or screenshot this email for quick access.
              </p>
            </div>
            
            <p style="color:#475569;font-size:12px;text-align:center;margin:16px 0 0;">
              Event Pass Management System — 27 Media Agency
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

  return resend.emails.send({
    from: getFromEmail(),
    to: params.to,
    subject: `Registration Update — ${params.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="margin:0;padding:0;background:#0C0F14;font-family:'Segoe UI',system-ui,sans-serif;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="background:#161A22;border:1px solid #1E2330;border-radius:12px;padding:32px;">
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
