import nodemailer from 'nodemailer';

// Create reusable transporter with lazy loading
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // Check if email is enabled
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      console.log('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
      return null;
    }

    // Validate required email configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration incomplete. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection on first use
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  }

  return transporter;
};

/**
 * Send ticket purchase confirmation email
 */
export const sendTicketPurchaseEmail = async ({
  to,
  playerName,
  tournamentName,
  tournamentLocation,
  eventName,
  eventDate,
  entryFee,
  transactionId,
  organizerName,
  organizerEmail
}) => {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not sent - email service disabled or not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            background: #ffffff;
            padding: 48px 40px 32px;
            border-bottom: 3px solid #16a34a;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.5px;
            margin: 0 0 8px 0;
          }
          .logo-accent {
            color: #16a34a;
          }
          .header-subtitle {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
            font-weight: 500;
          }
          .content {
            padding: 48px 40px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            background: #f0fdf4;
            border: 1px solid #16a34a;
            color: #166534;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 32px;
          }
          .greeting {
            font-size: 16px;
            color: #111827;
            margin: 0 0 24px 0;
            line-height: 1.5;
          }
          .event-details {
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 32px;
            margin: 32px 0;
          }
          .details-title {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 14px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .detail-row:first-child {
            padding-top: 0;
          }
          .detail-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          .detail-value {
            font-size: 14px;
            color: #111827;
            font-weight: 600;
            text-align: right;
            max-width: 60%;
          }
          .cta-button {
            display: inline-block;
            padding: 14px 28px;
            background: #16a34a;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            margin: 32px 0;
          }
          .info-section {
            margin: 32px 0;
            padding: 24px;
            background: #f9fafb;
            border-left: 3px solid #16a34a;
            border-radius: 4px;
          }
          .info-title {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 12px 0;
          }
          .info-list {
            margin: 0;
            padding-left: 20px;
            color: #4b5563;
            font-size: 14px;
          }
          .info-list li {
            margin: 8px 0;
            line-height: 1.5;
          }
          .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 32px 0;
          }
          .organizer-section {
            margin-top: 32px;
          }
          .organizer-label {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 8px 0;
          }
          .organizer-name {
            font-size: 15px;
            color: #111827;
            font-weight: 600;
            margin: 0 0 4px 0;
          }
          .organizer-email {
            color: #16a34a;
            text-decoration: none;
            font-size: 14px;
          }
          .footer {
            background: #f9fafb;
            padding: 32px 40px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          }
          .footer-text {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
            margin: 0 0 8px 0;
          }
          .footer a {
            color: #16a34a;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">Pickle<span class="logo-accent">Rally</span></div>
            <p class="header-subtitle">Tournament Registration Confirmation</p>
          </div>

          <div class="content">
            <div class="status-badge">Registration Confirmed</div>

            <p class="greeting">
              Dear ${playerName},<br><br>
              Thank you for registering for <strong>${tournamentName}</strong>. Your payment has been processed successfully and your spot is confirmed.
            </p>

            <div class="event-details">
              <div class="details-title">Registration Details</div>
              <div class="detail-row">
                <span class="detail-label">Tournament</span>
                <span class="detail-value">${tournamentName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Event</span>
                <span class="detail-value">${eventName}</span>
              </div>
              ${tournamentLocation ? `<div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">${tournamentLocation}</span>
              </div>` : ''}
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${new Date(eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Entry Fee</span>
                <span class="detail-value">$${entryFee.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${transactionId}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">View Dashboard</a>
            </div>

            <div class="info-section">
              <div class="info-title">Before the Event</div>
              <ul class="info-list">
                <li>Monitor your dashboard for pool assignments and match schedules</li>
                <li>Arrive at least 15 minutes before your scheduled match time</li>
                <li>Bring your paddle, appropriate footwear, and water</li>
                <li>Review the tournament format and rules</li>
              </ul>
            </div>

            <div class="divider"></div>

            <div class="organizer-section">
              <div class="organizer-label">Tournament Organizer</div>
              <div class="organizer-name">${organizerName}</div>
              <a href="mailto:${organizerEmail}" class="organizer-email">${organizerEmail}</a>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">
              For questions regarding this tournament, please contact the organizer directly.
            </p>
            <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
              © ${new Date().getFullYear()} PickleRally. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Pickle Rally - Tournament Registration Confirmed

Hi ${playerName},

Your registration for ${tournamentName} has been confirmed!

EVENT DETAILS:
Tournament: ${tournamentName}
Event: ${eventName}
Date: ${new Date(eventDate).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
Entry Fee: $${entryFee.toFixed(2)}
Transaction ID: ${transactionId}

ORGANIZER CONTACT:
${organizerName}
${organizerEmail}

View your tournaments: ${process.env.CLIENT_URL}/dashboard

Questions? Contact the tournament organizer at ${organizerEmail}

© ${new Date().getFullYear()} Pickle Rally
    `;

    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: `Registration Confirmed: ${tournamentName} - ${eventName}`,
      text: emailText,
      html: emailHtml,
    });

    console.log('Ticket purchase email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending ticket purchase email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async ({ to, name, role }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not sent - email service disabled or not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const roleMessage = role === 'organizer'
      ? 'You can now create and manage pickleball tournaments!'
      : 'You can now browse and register for tournaments!';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
          }
          .cta-button {
            background: #667eea;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 20px 0;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 36px;">🎾</h1>
          <h2 style="margin: 10px 0;">Welcome to Pickle Rally!</h2>
        </div>

        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>

          <p>Welcome to Pickle Rally - your go-to platform for pickleball tournaments! ${roleMessage}</p>

          <p style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">Go to Dashboard</a>
          </p>

          <p>If you have any questions, feel free to reach out to us.</p>

          <p>See you on the court!<br>
          <strong>The Pickle Rally Team</strong></p>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Welcome to Pickle Rally! 🎾',
      html: emailHtml,
    });

    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send team invitation email
 */
export const sendTeamInvitationEmail = async ({
  to,
  inviteeName,
  inviterName,
  teamName,
  eventName,
  tournamentName,
  invitationId
}) => {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not sent - email service disabled or not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const acceptUrl = `${process.env.CLIENT_URL}/invitations/${invitationId}/accept`;
    const declineUrl = `${process.env.CLIENT_URL}/invitations/${invitationId}/decline`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .invitation-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .detail-row {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #6b7280;
            display: block;
            margin-bottom: 5px;
          }
          .value {
            color: #111827;
            font-weight: 500;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .accept-button {
            background: #10b981;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 10px;
            font-weight: 600;
          }
          .decline-button {
            background: #6b7280;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 10px;
            font-weight: 600;
          }
          .footer {
            background: #374151;
            color: #d1d5db;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">🎾 Team Invitation</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">You've been invited to join a team!</p>
        </div>

        <div class="content">
          <p>Hi ${inviteeName || 'there'},</p>

          <p><strong>${inviterName}</strong> has invited you to join their team for an upcoming tournament!</p>

          <div class="invitation-box">
            <h3 style="margin-top: 0; color: #111827;">Team & Event Details</h3>
            <div class="detail-row">
              <span class="label">Team Name:</span>
              <span class="value">${teamName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tournament:</span>
              <span class="value">${tournamentName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Event:</span>
              <span class="value">${eventName}</span>
            </div>
          </div>

          <div class="button-container">
            <a href="${acceptUrl}" class="accept-button">✓ Accept Invitation</a>
            <a href="${declineUrl}" class="decline-button">✗ Decline</a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <strong>Note:</strong> You'll need to create an account or log in to accept this invitation.
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0;">
            © ${new Date().getFullYear()} Pickle Rally. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Pickle Rally - Team Invitation

Hi ${inviteeName || 'there'},

${inviterName} has invited you to join their team!

TEAM & EVENT DETAILS:
Team Name: ${teamName}
Tournament: ${tournamentName}
Event: ${eventName}

Accept this invitation: ${acceptUrl}
Decline: ${declineUrl}

Note: You'll need to create an account or log in to accept this invitation.

© ${new Date().getFullYear()} Pickle Rally
    `;

    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: `Team Invitation: ${teamName} - ${eventName}`,
      text: emailText,
      html: emailHtml,
    });

    console.log('Team invitation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending team invitation email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendTicketPurchaseEmail,
  sendWelcomeEmail,
  sendTeamInvitationEmail,
};
