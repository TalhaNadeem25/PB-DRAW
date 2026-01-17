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
  organizerEmail,
  ticketCode,
  qrCodeUrl,
  ticketPdfUrl
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
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
            font-size: 28px;
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
            padding: 8px 16px;
            background: #f0fdf4;
            border: 2px solid #16a34a;
            color: #166534;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 32px;
          }
          .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #16a34a;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
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
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
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
          .qr-section {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px solid #16a34a;
            border-radius: 12px;
            padding: 32px;
            margin: 32px 0;
            text-align: center;
          }
          .qr-title {
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #166534;
            margin: 0 0 16px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .qr-code-img {
            max-width: 200px;
            height: auto;
            margin: 16px auto;
            border: 4px solid #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .ticket-code {
            font-family: monospace;
            font-size: 16px;
            color: #166534;
            font-weight: 700;
            background: #ffffff;
            padding: 12px 20px;
            border-radius: 6px;
            display: inline-block;
            margin: 16px 0;
            border: 1px solid #16a34a;
          }
          .qr-instructions {
            color: #15803d;
            font-size: 13px;
            line-height: 1.6;
            margin: 16px 0 0 0;
          }
          .download-button {
            display: inline-block;
            padding: 12px 24px;
            background: #ffffff;
            color: #16a34a;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 16px 8px 0;
            border: 2px solid #16a34a;
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
            <div class="status-badge">
              <span class="status-dot"></span>
              Registration Confirmed
            </div>

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

            ${qrCodeUrl && ticketCode ? `
            <div class="qr-section">
              <div class="qr-title">🎫 Your Event Ticket</div>
              <img src="${qrCodeUrl}" alt="QR Code" class="qr-code-img" />
              <div class="ticket-code">${ticketCode}</div>
              <p class="qr-instructions">
                Present this QR code at check-in on event day.<br>
                Save this email or download your ticket PDF below.
              </p>
              ${ticketPdfUrl ? `
              <a href="${ticketPdfUrl}" class="download-button">📄 Download Ticket PDF</a>
              ` : ''}
            </div>
            ` : ''}

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
${ticketCode ? `
YOUR TICKET:
Ticket Code: ${ticketCode}
${ticketPdfUrl ? `Download PDF: ${ticketPdfUrl}` : ''}

Present your QR code at check-in on event day.
` : ''}
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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
            background: linear-gradient(135deg, #16a34a 0%, #12803a 100%);
            color: white;
            padding: 48px 40px 32px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }
          .logo {
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin: 0 0 12px 0;
          }
          .logo-accent {
            color: #f59e0b;
          }
          .header-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            margin: 0;
            font-weight: 500;
          }
          .content {
            background: #ffffff;
            padding: 48px 40px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #f0fdf4;
            border: 2px solid #16a34a;
            color: #166534;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
          }
          .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #16a34a;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .greeting {
            font-size: 16px;
            color: #111827;
            margin: 0 0 24px 0;
            line-height: 1.6;
          }
          .highlight-box {
            background: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 20px 24px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .highlight-text {
            font-size: 15px;
            color: #166534;
            margin: 0;
            font-weight: 500;
            line-height: 1.6;
          }
          .cta-button {
            display: inline-block;
            padding: 16px 32px;
            background: #16a34a;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2);
            transition: all 0.2s;
          }
          .cta-button:hover {
            background: #12803a;
            box-shadow: 0 6px 12px rgba(22, 163, 74, 0.3);
          }
          .footer {
            background: #f9fafb;
            padding: 32px 40px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 12px 12px;
            text-align: center;
          }
          .footer-text {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
            margin: 0 0 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">Pickle<span class="logo-accent">Rally</span></div>
            <p class="header-subtitle">🎾 Welcome to Your Pickleball Tournament Hub</p>
          </div>

          <div class="content">
            <div class="status-badge">
              <span class="status-dot"></span>
              Account Active
            </div>

            <p class="greeting">
              Hi <strong>${name}</strong>,
            </p>

            <p class="greeting">
              Welcome to Pickle Rally - your all-in-one platform for pickleball tournaments! We're excited to have you join our community.
            </p>

            <div class="highlight-box">
              <p class="highlight-text">
                ${roleMessage}
              </p>
            </div>

            <p class="greeting">
              Get started by exploring your personalized dashboard where you can manage your tournaments, track registrations, and connect with other players.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">Go to Dashboard</a>
            </div>

            <p class="greeting" style="margin-top: 32px;">
              If you have any questions or need assistance, our team is here to help.
            </p>

            <p class="greeting" style="margin-bottom: 0;">
              See you on the court!<br>
              <strong>The Pickle Rally Team</strong>
            </p>
          </div>

          <div class="footer">
            <p class="footer-text">
              You're receiving this email because you created an account on Pickle Rally.
            </p>
            <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
              © ${new Date().getFullYear()} PickleRally. All rights reserved.
            </p>
          </div>
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
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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
            background: linear-gradient(135deg, #16a34a 0%, #12803a 100%);
            color: white;
            padding: 48px 40px 32px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }
          .logo {
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin: 0 0 12px 0;
          }
          .logo-accent {
            color: #f59e0b;
          }
          .header-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            margin: 0;
            font-weight: 500;
          }
          .content {
            background: #ffffff;
            padding: 48px 40px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #f0fdf4;
            border: 2px solid #16a34a;
            color: #166534;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
          }
          .greeting {
            font-size: 16px;
            color: #111827;
            margin: 0 0 24px 0;
            line-height: 1.6;
          }
          .invitation-box {
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #16a34a;
            padding: 24px;
            border-radius: 8px;
            margin: 24px 0;
          }
          .invitation-title {
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
            font-size: 18px;
            color: #111827;
            margin: 0 0 16px 0;
            font-weight: 600;
          }
          .detail-row {
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .detail-row:first-child {
            padding-top: 0;
          }
          .label {
            font-weight: 600;
            color: #6b7280;
            display: block;
            margin-bottom: 4px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .value {
            color: #111827;
            font-weight: 600;
            font-size: 15px;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .accept-button {
            background: #16a34a;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin: 10px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2);
            transition: all 0.2s;
          }
          .accept-button:hover {
            background: #12803a;
            box-shadow: 0 6px 12px rgba(22, 163, 74, 0.3);
          }
          .decline-button {
            background: #6b7280;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin: 10px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
          }
          .decline-button:hover {
            background: #4b5563;
          }
          .info-note {
            margin-top: 32px;
            padding: 20px 24px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .note-text {
            color: #4b5563;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
          }
          .footer {
            background: #f9fafb;
            padding: 32px 40px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 12px 12px;
            text-align: center;
          }
          .footer-text {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
            margin: 0 0 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">Pickle<span class="logo-accent">Rally</span></div>
            <p class="header-subtitle">🎾 Team Invitation</p>
          </div>

          <div class="content">
            <div class="status-badge">
              Team Invitation
            </div>

            <p class="greeting">
              Hi <strong>${inviteeName || 'there'}</strong>,
            </p>

            <p class="greeting">
              Great news! <strong>${inviterName}</strong> has invited you to join their team for an upcoming tournament. They think you'd be a perfect partner!
            </p>

            <div class="invitation-box">
              <h3 class="invitation-title">Team & Event Details</h3>
              <div class="detail-row">
                <span class="label">Team Name</span>
                <span class="value">${teamName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Tournament</span>
                <span class="value">${tournamentName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Event</span>
                <span class="value">${eventName}</span>
              </div>
            </div>

            <div class="button-container">
              <a href="${acceptUrl}" class="accept-button">✓ Accept Invitation</a>
              <a href="${declineUrl}" class="decline-button">✗ Decline</a>
            </div>

            <div class="info-note">
              <p class="note-text">
                <strong>Note:</strong> You'll need to create an account or log in to accept this invitation. Once accepted, you'll be able to coordinate with your partner and prepare for the tournament together.
              </p>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">
              You're receiving this email because ${inviterName} invited you to join their team.
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

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not sent - email service disabled or not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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
            border-bottom: 3px solid #ef4444;
          }
          .logo {
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
            font-size: 28px;
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
            background: #fef2f2;
            border: 1px solid #ef4444;
            color: #991b1b;
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
          .warning-box {
            background: #fef2f2;
            border-left: 3px solid #ef4444;
            padding: 24px;
            margin: 32px 0;
            border-radius: 4px;
          }
          .warning-text {
            font-size: 14px;
            color: #991b1b;
            margin: 0;
            line-height: 1.6;
          }
          .cta-button {
            display: inline-block;
            padding: 14px 28px;
            background: #ef4444;
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
            border-left: 3px solid #6b7280;
            border-radius: 4px;
          }
          .info-text {
            margin: 0;
            color: #4b5563;
            font-size: 14px;
            line-height: 1.6;
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
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">Pickle<span class="logo-accent">Rally</span></div>
            <p class="header-subtitle">Password Reset Request</p>
          </div>

          <div class="content">
            <div class="status-badge">Password Reset</div>

            <p class="greeting">
              Hi ${name},<br><br>
              We received a request to reset your password for your Pickle Rally account. Click the button below to choose a new password.
            </p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-button">Reset Password</a>
            </div>

            <div class="warning-box">
              <p class="warning-text">
                <strong>This link will expire in 1 hour.</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>

            <div class="info-section">
              <p class="info-text">
                <strong>Having trouble?</strong><br>
                If the button above doesn't work, copy and paste this URL into your browser:<br>
                <span style="word-break: break-all; color: #111827; font-family: monospace; font-size: 12px;">${resetUrl}</span>
              </p>
            </div>

            <p class="greeting" style="margin-top: 32px;">
              If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <div class="footer">
            <p class="footer-text">
              This is an automated message, please do not reply to this email.
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
Pickle Rally - Password Reset Request

Hi ${name},

We received a request to reset your password for your Pickle Rally account.

Reset your password by clicking this link:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Pickle Rally
    `;

    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Reset Your Password - Pickle Rally',
      text: emailText,
      html: emailHtml,
    });

    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send waitlist joined confirmation email
 */
export const sendWaitlistJoinedEmail = async ({
  to,
  playerName,
  eventName,
  tournamentName,
  position,
  totalWaiting
}) => {
  const transport = getTransporter();

  if (!transport) {
    console.log('Email disabled - skipping waitlist joined email');
    return { success: false, error: 'Email service disabled' };
  }

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-family: 'Oswald', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
          .logo-accent { color: #fbbf24; }
          .header-subtitle { font-family: 'Inter', Arial, sans-serif; color: #ffffff; font-size: 16px; margin: 8px 0 0 0; opacity: 0.95; }
          .content { padding: 40px 30px; }
          .status-badge { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 12px 24px; border-radius: 8px; font-family: 'Oswald', Arial, sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-align: center; margin-bottom: 24px; }
          .greeting { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px; }
          .info-box { background: linear-gradient(135deg, #16a34a10 0%, #15803d10 100%); border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin: 24px 0; }
          .info-text { font-size: 14px; color: #1f2937; margin: 0; line-height: 1.6; }
          .position-highlight { font-family: 'Oswald', Arial, sans-serif; font-size: 48px; font-weight: 700; color: #16a34a; text-align: center; margin: 32px 0; }
          .position-label { font-size: 16px; color: #6b7280; text-align: center; margin-top: -20px; margin-bottom: 32px; }
          .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; }
          .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Pickle<span class="logo-accent">Rally</span></div>
            <p class="header-subtitle">You're on the Waitlist!</p>
          </div>

          <div class="content">
            <div class="status-badge">Waitlist Confirmation</div>

            <p class="greeting">
              Hi ${playerName},<br><br>
              You've been added to the waitlist for <strong>${eventName}</strong> at <strong>${tournamentName}</strong>.
            </p>

            <div class="position-highlight">#${position}</div>
            <div class="position-label">Your Position on the Waitlist</div>

            <div class="info-box">
              <p class="info-text">
                <strong>What happens next?</strong><br><br>
                You're currently <strong>${position === 1 ? 'first' : `#${position}`}</strong> on the waitlist with <strong>${totalWaiting} ${totalWaiting === 1 ? 'person' : 'people'}</strong> waiting total.<br><br>
                If a spot opens up, we'll send you an email with a payment link. You'll have <strong>24 hours</strong> to complete your registration.<br><br>
                We'll keep you updated as your position changes!
              </p>
            </div>

            <p class="greeting" style="margin-top: 32px;">
              Good luck, and we hope to see you on the court soon!
            </p>
          </div>

          <div class="footer">
            <p class="footer-text">
              This is an automated message from Pickle Rally.
            </p>
            <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
              © ${new Date().getFullYear()} PickleRally. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: `You're on the Waitlist - ${tournamentName}`,
      html: emailHtml,
    });

    console.log('Waitlist joined email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending waitlist joined email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send waitlist promotion email (spot available)
 */
export const sendWaitlistPromotionEmail = async ({
  to,
  playerName,
  tournamentName,
  eventName,
  paymentUrl,
  expiresAt,
  deadline
}) => {
  const transport = getTransporter();

  if (!transport) {
    console.log('Email disabled - skipping waitlist promotion email');
    return { success: false, error: 'Email service disabled' };
  }

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-family: 'Oswald', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
          .logo-accent { color: #fbbf24; }
          .header-subtitle { font-family: 'Inter', Arial, sans-serif; color: #ffffff; font-size: 16px; margin: 8px 0 0 0; opacity: 0.95; }
          .content { padding: 40px 30px; }
          .status-badge { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 12px 24px; border-radius: 8px; font-family: 'Oswald', Arial, sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-align: center; margin-bottom: 24px; }
          .greeting { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: 'Oswald', Arial, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; margin: 24px 0; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); }
          .warning-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0; }
          .warning-text { font-size: 14px; color: #92400e; margin: 0; line-height: 1.6; }
          .deadline-box { text-align: center; background: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0; }
          .deadline-text { font-family: 'Oswald', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #dc2626; margin: 0; }
          .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; }
          .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Pickle<span class="logo-accent">Rally</span></div>
            <p class="header-subtitle">A Spot Just Opened Up!</p>
          </div>

          <div class="content">
            <div class="status-badge">🎉 You're Promoted!</div>

            <p class="greeting">
              Hi ${playerName},<br><br>
              Great news! A spot has opened up for <strong>${eventName}</strong> at <strong>${tournamentName}</strong>!
            </p>

            <div class="deadline-box">
              <p class="deadline-text">⏰ ${deadline} to Register</p>
              <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Deadline: ${new Date(expiresAt).toLocaleString()}</p>
            </div>

            <div style="text-align: center;">
              <a href="${paymentUrl}" class="cta-button">Complete Registration Now</a>
            </div>

            <div class="warning-box">
              <p class="warning-text">
                <strong>Act fast!</strong> You have <strong>${deadline}</strong> to complete your payment and secure your spot. If you don't register within this time, your spot will be offered to the next person on the waitlist.
              </p>
            </div>

            <p class="greeting" style="margin-top: 32px;">
              We're excited to have you join us on the court!
            </p>
          </div>

          <div class="footer">
            <p class="footer-text">
              This is an automated message from Pickle Rally.
            </p>
            <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
              © ${new Date().getFullYear()} PickleRally. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: `🎉 Spot Available! Complete Your Registration - ${tournamentName}`,
      html: emailHtml,
    });

    console.log('Waitlist promotion email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending waitlist promotion email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send waitlist promotion expired email
 */
export const sendWaitlistExpiredEmail = async ({
  to,
  playerName,
  eventName,
  rejoinUrl
}) => {
  const transport = getTransporter();

  if (!transport) {
    console.log('Email disabled - skipping waitlist expired email');
    return { success: false, error: 'Email service disabled' };
  }

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-family: 'Oswald', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
          .logo-accent { color: #fbbf24; }
          .header-subtitle { font-family: 'Inter', Arial, sans-serif; color: #ffffff; font-size: 16px; margin: 8px 0 0 0; opacity: 0.95; }
          .content { padding: 40px 30px; }
          .status-badge { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: #ffffff; padding: 12px 24px; border-radius: 8px; font-family: 'Oswald', Arial, sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-align: center; margin-bottom: 24px; }
          .greeting { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: 'Oswald', Arial, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; margin: 24px 0; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); }
          .info-box { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; border-radius: 8px; margin: 24px 0; }
          .info-text { font-size: 14px; color: #374151; margin: 0; line-height: 1.6; }
          .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; }
          .footer-text { color: #6b7280; font-size: 14px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Pickle<span class="logo-accent">Rally</span></div>
            <p class="header-subtitle">Registration Window Closed</p>
          </div>

          <div class="content">
            <div class="status-badge">Promotion Expired</div>

            <p class="greeting">
              Hi ${playerName},<br><br>
              Your 24-hour registration window for <strong>${eventName}</strong> has expired, and your spot has been offered to the next person on the waitlist.
            </p>

            <div class="info-box">
              <p class="info-text">
                <strong>Still interested?</strong><br><br>
                You can rejoin the waitlist if you're still interested in participating. We'll notify you again if another spot opens up.
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${rejoinUrl}" class="cta-button">Rejoin Waitlist</a>
            </div>

            <p class="greeting" style="margin-top: 32px;">
              We hope to see you at a future tournament!
            </p>
          </div>

          <div class="footer">
            <p class="footer-text">
              This is an automated message from Pickle Rally.
            </p>
            <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
              © ${new Date().getFullYear()} PickleRally. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: `Registration Window Expired - ${eventName}`,
      html: emailHtml,
    });

    console.log('Waitlist expired email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending waitlist expired email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send cancellation confirmation email
 */
export const sendCancellationConfirmationEmail = async ({ user, tournament, event, refundAmount }) => {
  try {
    await sendEmail({
      to: user.email,
      subject: `Cancellation Confirmed - ${tournament.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .refund-amount { font-size: 32px; font-weight: bold; color: #667eea; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏓 Cancellation Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>

              <p>Your registration cancellation has been processed successfully.</p>

              <div class="info-box">
                <h3 style="margin-top: 0;">Cancellation Details</h3>
                <p><strong>Tournament:</strong> ${tournament.name}</p>
                <p><strong>Event:</strong> ${event.name}</p>
                <p><strong>Refund Amount:</strong> <span class="refund-amount">$${refundAmount.toFixed(2)}</span></p>
              </div>

              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your refund will be processed within 5-10 business days</li>
                <li>The refund will appear in your original payment method</li>
                <li>You'll receive a confirmation when the refund is complete</li>
              </ul>

              <p>We're sorry to see you cancel. If you have any questions or concerns, please don't hesitate to reach out to the tournament organizer.</p>

              <p style="margin-top: 30px;">Best regards,<br>The PicklePlay Team</p>
            </div>
            <div class="footer">
              <p>PicklePlay - Pickleball Tournament Management</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Error sending cancellation confirmation email:', error);
  }
};

/**
 * Send partner notification email when one player cancels
 */
export const sendPartnerNotificationEmail = async ({ partner, cancelingPlayer, tournament, event, cancellation, deadline }) => {
  try {
    const responseLink = `${process.env.CLIENT_URL}/partner-response/${cancellation._id}`;

    await sendEmail({
      to: partner.email,
      subject: `Important: Your Partner Has Canceled - ${tournament.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .options-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .option { padding: 15px; margin: 10px 0; border: 2px solid #ddd; border-radius: 8px; transition: all 0.3s; }
            .cta-button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
            .deadline { color: #dc3545; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Partner Cancellation Notice</h1>
            </div>
            <div class="content">
              <p>Hi ${partner.name},</p>

              <div class="alert-box">
                <p><strong>Your partner ${cancelingPlayer.name} has requested to cancel their registration for:</strong></p>
                <p><strong>Tournament:</strong> ${tournament.name}</p>
                <p><strong>Event:</strong> ${event.name}</p>
              </div>

              <p>We need to know what you'd like to do. You have <strong class="deadline">72 hours</strong> to make your decision.</p>

              <div class="options-box">
                <h3 style="margin-top: 0;">Your Options:</h3>

                <div class="option">
                  <h4>🔍 Option 1: Find a New Partner</h4>
                  <p>Stay in the tournament and find a new partner to compete with. We'll help you connect with available players.</p>
                  <ul>
                    <li>You keep your spot in the event</li>
                    <li>Your partner gets their refund</li>
                    <li>You can search for available partners on our platform</li>
                  </ul>
                </div>

                <div class="option">
                  <h4>💰 Option 2: Get a Refund</h4>
                  <p>Cancel your registration as well and receive a full refund.</p>
                  <ul>
                    <li>Both you and your partner receive refunds</li>
                    <li>Your spot opens up for waitlist players</li>
                    <li>Refund processed within 5-10 business days</li>
                  </ul>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${responseLink}" class="cta-button">Make Your Decision</a>
              </div>

              <p><strong>Decision Deadline:</strong> <span class="deadline">${new Date(deadline).toLocaleString()}</span></p>

              <p><em>If you don't respond by the deadline, please contact the tournament organizer directly to discuss your options.</em></p>

              <p style="margin-top: 30px;">Best regards,<br>The PicklePlay Team</p>
            </div>
            <div class="footer">
              <p>PicklePlay - Pickleball Tournament Management</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Error sending partner notification email:', error);
  }
};

/**
 * Send partner refund confirmation email
 */
export const sendPartnerRefundEmail = async ({ partner, tournament, event, refundAmount }) => {
  try {
    await sendEmail({
      to: partner.email,
      subject: `Refund Processed - ${tournament.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .refund-amount { font-size: 32px; font-weight: bold; color: #667eea; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏓 Refund Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${partner.name},</p>

              <p>Your refund request has been processed following your partner's cancellation.</p>

              <div class="info-box">
                <h3 style="margin-top: 0;">Refund Details</h3>
                <p><strong>Tournament:</strong> ${tournament.name}</p>
                <p><strong>Event:</strong> ${event.name}</p>
                <p><strong>Refund Amount:</strong> <span class="refund-amount">$${refundAmount.toFixed(2)}</span></p>
              </div>

              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your refund will be processed within 5-10 business days</li>
                <li>The refund will appear in your original payment method</li>
                <li>You'll receive a confirmation when the refund is complete</li>
              </ul>

              <p>We hope to see you at future tournaments!</p>

              <p style="margin-top: 30px;">Best regards,<br>The PicklePlay Team</p>
            </div>
            <div class="footer">
              <p>PicklePlay - Pickleball Tournament Management</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Error sending partner refund email:', error);
  }
};

/**
 * Send bulk communication email to tournament participants
 */
export const sendBulkCommunicationEmail = async ({
  to,
  recipientName,
  subject,
  message,
  tournamentName,
  organizerName,
  template = 'custom'
}) => {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not sent - email service disabled or not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    // Convert markdown-style formatting to HTML
    const formatMessage = (msg) => {
      return msg
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #16a34a;">$1</a>');
    };

    const formattedMessage = formatMessage(message);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background: #f9fafb;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            padding: 32px 40px;
            text-align: center;
          }
          .logo {
            font-family: 'Oswald', 'Arial Black', Arial, sans-serif;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin: 0 0 8px 0;
          }
          .tournament-name {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin: 0;
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 16px;
            color: #111827;
            margin: 0 0 24px 0;
          }
          .message-content {
            font-size: 15px;
            color: #374151;
            line-height: 1.7;
          }
          .message-content p {
            margin: 0 0 16px 0;
          }
          .message-content ul, .message-content ol {
            margin: 0 0 16px 0;
            padding-left: 24px;
          }
          .message-content li {
            margin: 8px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 14px 28px;
            background: #16a34a;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            margin: 24px 0;
          }
          .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 32px 0;
          }
          .organizer-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }
          .organizer-label {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
          }
          .organizer-name {
            font-size: 14px;
            color: #111827;
            font-weight: 500;
          }
          .footer {
            background: #f9fafb;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer-text {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
            margin: 0;
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
            <div class="logo">PickleRally</div>
            <p class="tournament-name">${tournamentName}</p>
          </div>

          <div class="content">
            <p class="greeting">Hi ${recipientName || 'there'},</p>
            
            <div class="message-content">
              <p>${formattedMessage}</p>
            </div>

            <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">View Dashboard</a>

            <div class="organizer-section">
              <p class="organizer-label">Message from</p>
              <p class="organizer-name">${organizerName} - Tournament Organizer</p>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">
              This message was sent regarding your participation in ${tournamentName}.<br>
              <a href="${process.env.CLIENT_URL}">Visit PickleRally</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
${tournamentName}

Hi ${recipientName || 'there'},

${message}

---
Message from: ${organizerName} - Tournament Organizer

Visit your dashboard: ${process.env.CLIENT_URL}/dashboard
    `;

    const info = await transport.sendMail({
      from: \`"PickleRally" <\${process.env.EMAIL_FROM || process.env.EMAIL_USER}>\`,
      to: to,
      subject: subject,
      text: emailText,
      html: emailHtml,
    });

    console.log('Bulk communication email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending bulk communication email:', error);
    throw error;
  }
};

export default {
  sendTicketPurchaseEmail,
  sendWelcomeEmail,
  sendTeamInvitationEmail,
  sendPasswordResetEmail,
  sendWaitlistJoinedEmail,
  sendWaitlistPromotionEmail,
  sendWaitlistExpiredEmail,
  sendCancellationConfirmationEmail,
  sendPartnerNotificationEmail,
  sendPartnerRefundEmail,
  sendBulkCommunicationEmail,
};
