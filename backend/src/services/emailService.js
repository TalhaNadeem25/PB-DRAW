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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background: #f3f4f6;
          }
          .email-wrapper {
            background: #f3f4f6;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-radius: 12px 12px 0 0;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '🎾';
            position: absolute;
            font-size: 120px;
            opacity: 0.1;
            top: -20px;
            right: -20px;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            font-family: 'Oswald', sans-serif;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.95;
          }
          .content {
            background: white;
            padding: 40px 30px;
            border-left: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
          }
          .success-badge {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #78350f;
            padding: 12px 24px;
            border-radius: 24px;
            display: inline-block;
            margin: 0 0 24px 0;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(251, 191, 36, 0.3);
          }
          .ticket-details {
            background: linear-gradient(to bottom, #f0fdf4, #dcfce7);
            padding: 24px;
            border-radius: 12px;
            margin: 24px 0;
            border: 2px solid #16a34a;
            position: relative;
          }
          .ticket-details::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #16a34a, #fbbf24, #16a34a);
          }
          .ticket-details h3 {
            margin: 0 0 16px 0;
            color: #15803d;
            font-size: 18px;
            font-weight: 700;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #bbf7d0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #166534;
          }
          .value {
            color: #1f2937;
            font-weight: 600;
            text-align: right;
          }
          .location-badge {
            background: white;
            border: 2px solid #16a34a;
            color: #15803d;
            padding: 8px 16px;
            border-radius: 8px;
            display: inline-block;
            margin: 16px 0;
            font-weight: 600;
            font-size: 14px;
          }
          .cta-button {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin: 24px 0;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(22, 163, 74, 0.3);
            transition: transform 0.2s;
          }
          .next-steps {
            background: #fef9c3;
            border-left: 4px solid #fbbf24;
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
          }
          .next-steps h4 {
            margin: 0 0 12px 0;
            color: #78350f;
            font-size: 16px;
          }
          .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #78350f;
          }
          .next-steps li {
            margin: 8px 0;
          }
          .footer {
            background: #1f2937;
            color: #d1d5db;
            padding: 30px;
            text-align: center;
            font-size: 14px;
            border-radius: 0 0 12px 12px;
          }
          .footer a {
            color: #86efac;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>🏓 PICKLE RALLY</h1>
            <p>Registration Confirmed</p>
          </div>

          <div class="content">
            <div class="success-badge">✓ PAYMENT SUCCESSFUL</div>

            <p style="font-size: 16px; margin: 0 0 16px 0;">Hi <strong>${playerName}</strong>,</p>

            <p style="font-size: 16px; margin: 0 0 24px 0;">Great news! You're all set for <strong>${tournamentName}</strong>. Time to bring your A-game! 🎾</p>

            <div class="ticket-details">
              <h3>🎟️ Event Details</h3>
              <div class="detail-row">
                <span class="label">Tournament</span>
                <span class="value">${tournamentName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Event</span>
                <span class="value">${eventName}</span>
              </div>
              ${tournamentLocation ? `<div class="detail-row">
                <span class="label">Location</span>
                <span class="value">${tournamentLocation}</span>
              </div>` : ''}
              <div class="detail-row">
                <span class="label">Date</span>
                <span class="value">${new Date(eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div class="detail-row">
                <span class="label">Entry Fee</span>
                <span class="value">$${entryFee.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction ID</span>
                <span class="value" style="font-family: monospace; font-size: 12px;">${transactionId}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">View My Dashboard</a>
            </div>

            <div class="next-steps">
              <h4>📋 What's Next?</h4>
              <ul>
                <li>Check your dashboard for tournament updates and pool assignments</li>
                <li>Arrive 15 minutes early on event day for check-in</li>
                <li>Bring your paddle, water bottle, and competitive spirit!</li>
                <li>Review the tournament rules and format</li>
              </ul>
            </div>

            <div style="margin-top: 30px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #15803d;">Tournament Organizer</p>
              <p style="margin: 0;">
                <strong>${organizerName}</strong><br>
                <a href="mailto:${organizerEmail}" style="color: #16a34a;">${organizerEmail}</a>
              </p>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 12px 0;">
              Questions about the tournament?<br>
              Contact <a href="mailto:${organizerEmail}">${organizerName}</a>
            </p>
            <p style="margin: 12px 0 0 0; font-size: 12px; opacity: 0.8;">
              © ${new Date().getFullYear()} Pickle Rally. All rights reserved.
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
