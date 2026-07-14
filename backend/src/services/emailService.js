import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      console.log('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
      return null;
    }
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration incomplete. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD.');
      return null;
    }
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
    transporter.verify((error) => {
      if (error) console.error('Email transporter verification failed:', error);
      else console.log('Email server is ready to send messages');
    });
  }
  return transporter;
};

// ─── Shared CSS ───────────────────────────────────────────────────────────────
// Restrained, editorial styling — a single accent color used sparingly, quiet
// hairline borders instead of tinted boxes, and sentence-case labels instead
// of boxed all-caps monospace badges. Every send*Email function below reuses
// these same class names, so the whole system's look changes from editing
// only this block, header()/footer()/wrap() — no need to touch the 14
// individual templates.

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #EDE9E0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
  /* Header */
  .hdr { padding: 34px 40px 26px; border-bottom: 2px solid #1F4A2E; }
  .hdr-logo { font-size: 18px; font-weight: 700; color: #0F0F0E; letter-spacing: -0.01em; }
  .hdr-sub { display: none; }
  .stripe { display: none; }
  /* Body */
  .body { padding: 40px; }
  /* Eyebrow (plain text, no badge/box — a boxed status chip is what read as templated) */
  .pill { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 16px; background: none; border: none; padding: 0; border-radius: 0; }
  .pill-green { color: #1F4A2E; }
  .pill-amber { color: #96650F; }
  .pill-red   { color: #A23B2E; }
  .pill-grey  { color: #86807A; }
  /* Heading */
  .h1 { font-size: 23px; font-weight: 700; color: #0F0F0E; letter-spacing: -0.02em; line-height: 1.3; margin-bottom: 14px; }
  .h2 { font-size: 15px; font-weight: 600; color: #0F0F0E; margin-bottom: 8px; }
  /* Body text */
  .p { font-size: 15px; color: #47443E; line-height: 1.65; margin-bottom: 16px; }
  .p-sm { font-size: 13px; color: #86807A; line-height: 1.6; margin-bottom: 12px; }
  /* Detail table */
  .card { margin: 28px 0; }
  .card-hdr { padding: 0 0 10px; }
  .card-label { font-size: 12px; font-weight: 600; text-transform: none; letter-spacing: 0; color: #86807A; }
  .card-row { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0; border-bottom: 1px solid #F0EDE6; }
  .card-row:last-child { border-bottom: none; }
  .row-label { font-size: 14px; color: #86807A; }
  .row-value { font-size: 14px; font-weight: 600; color: #0F0F0E; text-align: right; max-width: 60%; }
  .row-value-mono { font-family: 'SF Mono', 'Courier New', monospace; font-size: 13px; font-weight: 500; color: #0F0F0E; }
  /* CTA button */
  .btn { display: inline-block; padding: 13px 26px; background: #1F4A2E; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; }
  .btn-outline { display: inline-block; padding: 13px 26px; background: transparent; color: #1F4A2E !important; text-decoration: none; font-size: 14px; font-weight: 600; border: 1.5px solid #D8D2C5; border-radius: 8px; }
  .btn-red { display: inline-block; padding: 13px 26px; background: #A23B2E; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; }
  .btn-wrap { margin: 30px 0 6px; }
  /* Note box — a thin rule instead of a tinted background block */
  .info, .info-amber, .info-red { border-left: 2px solid #D8D2C5; padding: 1px 0 1px 16px; margin: 22px 0; background: none; }
  .info-amber { border-left-color: #C08A2E; }
  .info-red { border-left-color: #A23B2E; }
  .info p, .info-amber p, .info-red p { font-size: 14px; line-height: 1.6; margin: 0; }
  .info p { color: #6B665F; }
  .info-amber p { color: #7C5215; }
  .info-red p { color: #8B3226; }
  /* QR section */
  .qr-box { border: 1px solid #ECE8E0; border-radius: 10px; padding: 32px; margin: 28px 0; text-align: center; background: #FBFAF7; }
  .qr-label { font-size: 12px; font-weight: 600; text-transform: none; letter-spacing: 0; color: #86807A; margin-bottom: 18px; }
  .ticket-code { font-family: 'SF Mono', 'Courier New', monospace; font-size: 15px; font-weight: 600; color: #0F0F0E; letter-spacing: 0.04em; display: inline-block; padding: 9px 18px; background: #ffffff; border: 1px solid #ECE8E0; border-radius: 8px; margin: 14px 0; }
  /* Divider */
  .divider { height: 1px; background: #ECE8E0; margin: 28px 0; }
  /* Big stat */
  .stat { text-align: center; padding: 20px 0; }
  .stat-num { font-size: 46px; font-weight: 700; color: #1F4A2E; letter-spacing: -0.03em; line-height: 1; }
  .stat-label { font-size: 13px; text-transform: none; letter-spacing: 0; color: #86807A; margin-top: 10px; }
  /* Organizer row */
  .org { margin-top: 28px; padding-top: 20px; border-top: 1px solid #ECE8E0; }
  .org-label { font-size: 12px; text-transform: none; letter-spacing: 0; color: #86807A; margin-bottom: 4px; }
  .org-name { font-size: 14px; font-weight: 600; color: #0F0F0E; margin-bottom: 2px; }
  .org-email { font-size: 13px; color: #1F4A2E; text-decoration: none; }
  /* Footer */
  .ftr { padding: 26px 40px 34px; text-align: center; }
  .ftr p { font-size: 12px; color: #A6A196; line-height: 1.6; margin-bottom: 4px; }
  .ftr a { color: #86807A; text-decoration: underline; }
`;

// ─── Shared layout helpers ────────────────────────────────────────────────────

const header = (subtitle) => `
  <div class="hdr">
    <div class="hdr-logo">PB Draw</div>
    <div class="hdr-sub">${subtitle || ''}</div>
  </div>
`;

const footer = (note) => `
  <div class="ftr">
    ${note ? `<p>${note}</p>` : ''}
    <p>© ${new Date().getFullYear()} PB Draw</p>
  </div>
`;

const wrap = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PB Draw</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="wrap">
    ${content}
  </div>
</body>
</html>`;

// ─── 1. Ticket purchase / registration confirmation ───────────────────────────

export const sendTicketPurchaseEmail = async ({
  to, playerName, tournamentName, tournamentLocation, eventName,
  eventDate, entryFee, transactionId, organizerName, organizerEmail,
  ticketCode, qrCodeUrl, ticketPdfUrl
}) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBA';

  const html = wrap(`
    ${header('Tournament Registration')}
    <div class="body">
      <div class="pill pill-green">Registration Confirmed</div>
      <div class="h1">${tournamentName}</div>
      <p class="p">Hi ${playerName}, your payment was processed and your spot is confirmed.</p>

      <div class="card">
        <div class="card-hdr"><span class="card-label">Registration Details</span></div>
        <div class="card-row"><span class="row-label">Event</span><span class="row-value">${eventName}</span></div>
        ${tournamentLocation ? `<div class="card-row"><span class="row-label">Location</span><span class="row-value">${tournamentLocation}</span></div>` : ''}
        <div class="card-row"><span class="row-label">Date</span><span class="row-value">${dateStr}</span></div>
        <div class="card-row"><span class="row-label">Entry Fee</span><span class="row-value">$${entryFee.toFixed(2)}</span></div>
        <div class="card-row"><span class="row-label">Transaction ID</span><span class="row-value row-value-mono">${transactionId}</span></div>
      </div>

      ${qrCodeUrl && ticketCode ? `
      <div class="qr-box">
        <div class="qr-label">Your Event Ticket</div>
        <img src="${qrCodeUrl}" alt="QR Code" style="width:180px;height:auto;display:block;margin:0 auto;" />
        <div class="ticket-code">${ticketCode}</div>
        <p class="p-sm" style="margin-top:12px;">Present this QR code at check-in on event day.</p>
        ${ticketPdfUrl ? `<div style="margin-top:16px;"><a href="${ticketPdfUrl}" class="btn-outline">Download Ticket PDF</a></div>` : ''}
      </div>
      ` : ''}

      <div class="btn-wrap">
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>
      </div>

      <div class="info">
        <p><strong>Before the event:</strong> Arrive 15 minutes early, bring your paddle and water, and check your dashboard for pool assignments and schedule.</p>
      </div>

      ${organizerName ? `
      <div class="org">
        <div class="org-label">Tournament Organizer</div>
        <div class="org-name">${organizerName}</div>
        ${organizerEmail ? `<a href="mailto:${organizerEmail}" class="org-email">${organizerEmail}</a>` : ''}
      </div>
      ` : ''}
    </div>
    ${footer('Questions? Contact the tournament organizer directly.')}
  `);

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: `Registration Confirmed: ${tournamentName} — ${eventName}`,
      html,
    });
    console.log('Ticket purchase email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending ticket purchase email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 2. Welcome email ─────────────────────────────────────────────────────────

export const sendWelcomeEmail = async ({ to, name, role }) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const roleNote = role === 'organizer'
    ? 'Your organizer account is active. Head to your dashboard to create your first tournament.'
    : 'Your player account is active. Browse upcoming tournaments and register to compete.';

  const html = wrap(`
    ${header('Welcome to PB Draw')}
    <div class="body">
      <div class="pill pill-green">Account Active</div>
      <div class="h1">Welcome, ${name}.</div>
      <p class="p">You're now part of the PB Draw community — the home for competitive pickleball tournaments.</p>
      <div class="info">
        <p>${roleNote}</p>
      </div>
      <div class="btn-wrap">
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard</a>
      </div>
      <p class="p-sm">See you on the court — The PB Draw Team</p>
    </div>
    ${footer("You're receiving this because you created an account on PB Draw.")}
  `);

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: 'Welcome to PB Draw',
      html,
    });
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 3. Team invitation ───────────────────────────────────────────────────────

export const sendTeamInvitationEmail = async ({
  to, inviteeName, inviterName, teamName, eventName, tournamentName, invitationId
}) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const acceptUrl  = `${process.env.CLIENT_URL}/invitations/${invitationId}/accept`;
  const declineUrl = `${process.env.CLIENT_URL}/invitations/${invitationId}/decline`;

  const html = wrap(`
    ${header('Partner Invitation')}
    <div class="body">
      <div class="pill pill-amber">Team Invitation</div>
      <div class="h1">You've been invited.</div>
      <p class="p">Hi ${inviteeName || 'there'} — <strong>${inviterName}</strong> has registered for an upcoming tournament and listed you as their partner.</p>

      <div class="card">
        <div class="card-hdr"><span class="card-label">Invitation Details</span></div>
        <div class="card-row"><span class="row-label">Team</span><span class="row-value">${teamName}</span></div>
        <div class="card-row"><span class="row-label">Tournament</span><span class="row-value">${tournamentName}</span></div>
        <div class="card-row"><span class="row-label">Event</span><span class="row-value">${eventName}</span></div>
      </div>

      <p class="p">Register and pay your entry fee to complete the team. Once both of you have paid, you'll be confirmed as a team.</p>

      <div class="btn-wrap">
        <a href="${acceptUrl}" class="btn" style="margin-right:12px;">Accept &amp; Register</a>
        <a href="${declineUrl}" class="btn-outline">Decline</a>
      </div>

      <div class="info">
        <p>You'll need a PB Draw account to accept this invitation. If you don't have one, you can create one for free at the link above.</p>
      </div>
    </div>
    ${footer(`You're receiving this because ${inviterName} invited you to join their team.`)}
  `);

  const text = `
PB Draw — Partner Invitation

Hi ${inviteeName || 'there'},

${inviterName} has invited you to join their team for ${eventName} at ${tournamentName}.

Team: ${teamName}
Tournament: ${tournamentName}
Event: ${eventName}

Accept invitation: ${acceptUrl}
Decline: ${declineUrl}

© ${new Date().getFullYear()} PB Draw
  `;

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: `Partner Invitation: ${eventName} — ${tournamentName}`,
      text,
      html,
    });
    console.log('Team invitation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending team invitation email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 4. Password reset ────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const html = wrap(`
    ${header('Password Reset')}
    <div class="body">
      <div class="pill pill-red">Password Reset</div>
      <div class="h1">Reset your password.</div>
      <p class="p">Hi ${name} — we received a request to reset the password for your PB Draw account. Click below to choose a new one.</p>

      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>

      <div class="info-amber">
        <p><strong>This link expires in 1 hour.</strong> If you didn't request a reset, you can ignore this email — your password won't change.</p>
      </div>

      <div class="info">
        <p>If the button doesn't work, copy and paste this URL into your browser:<br>
        <span style="font-family:'Courier New',monospace;font-size:12px;word-break:break-all;color:#0F0F0E;">${resetUrl}</span></p>
      </div>
    </div>
    ${footer('This is an automated message — please do not reply.')}
  `);

  const text = `
PB Draw — Password Reset

Hi ${name},

Reset your password: ${resetUrl}

This link expires in 1 hour. If you didn't request a reset, ignore this email.

© ${new Date().getFullYear()} PB Draw
  `;

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: 'Reset Your Password — PB Draw',
      text,
      html,
    });
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 5. Waitlist joined ───────────────────────────────────────────────────────

export const sendWaitlistJoinedEmail = async ({
  to, playerName, eventName, tournamentName, position, totalWaiting
}) => {
  const transport = getTransporter();
  if (!transport) return { success: false, error: 'Email service disabled' };

  const html = wrap(`
    ${header('Waitlist Confirmation')}
    <div class="body">
      <div class="pill pill-amber">On the Waitlist</div>
      <div class="h1">${tournamentName}</div>
      <p class="p">Hi ${playerName} — you've been added to the waitlist for <strong>${eventName}</strong>.</p>

      <div class="stat">
        <div class="stat-num">#${position}</div>
        <div class="stat-label">Your waitlist position · ${totalWaiting} total waiting</div>
      </div>

      <div class="info">
        <p>If a spot opens up, we'll send you an email with a payment link. You'll have <strong>24 hours</strong> to complete your registration before the spot moves to the next person.</p>
      </div>

      <div class="btn-wrap">
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>
      </div>
    </div>
    ${footer('You will be notified if a spot becomes available.')}
  `);

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: `Waitlist Confirmed: ${tournamentName} — ${eventName}`,
      html,
    });
    console.log('Waitlist joined email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending waitlist joined email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 6. Waitlist promotion (spot available) ───────────────────────────────────

export const sendWaitlistPromotionEmail = async ({
  to, playerName, tournamentName, eventName, paymentUrl, expiresAt, deadline
}) => {
  const transport = getTransporter();
  if (!transport) return { success: false, error: 'Email service disabled' };

  const deadlineStr = new Date(expiresAt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const html = wrap(`
    ${header('Spot Available')}
    <div class="body">
      <div class="pill pill-green">Spot Available</div>
      <div class="h1">Your spot just opened up.</div>
      <p class="p">Hi ${playerName} — a spot has opened for <strong>${eventName}</strong> at <strong>${tournamentName}</strong>. Act fast.</p>

      <div class="card">
        <div class="card-row"><span class="row-label">Event</span><span class="row-value">${eventName}</span></div>
        <div class="card-row"><span class="row-label">Tournament</span><span class="row-value">${tournamentName}</span></div>
        <div class="card-row"><span class="row-label">Deadline</span><span class="row-value">${deadlineStr}</span></div>
      </div>

      <div class="btn-wrap">
        <a href="${paymentUrl}" class="btn">Complete Registration</a>
      </div>

      <div class="info-amber">
        <p>You have <strong>${deadline}</strong> to complete payment. If you don't register in time, your spot will be offered to the next person on the waitlist.</p>
      </div>
    </div>
    ${footer('This is an automated message from PB Draw.')}
  `);

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: `Spot Available — Register Now: ${tournamentName}`,
      html,
    });
    console.log('Waitlist promotion email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending waitlist promotion email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 7. Waitlist expired ──────────────────────────────────────────────────────

export const sendWaitlistExpiredEmail = async ({ to, playerName, eventName, rejoinUrl }) => {
  const transport = getTransporter();
  if (!transport) return { success: false, error: 'Email service disabled' };

  const html = wrap(`
    ${header('Registration Window Closed')}
    <div class="body">
      <div class="pill pill-grey">Promotion Expired</div>
      <div class="h1">Your window has closed.</div>
      <p class="p">Hi ${playerName} — your 24-hour registration window for <strong>${eventName}</strong> has expired and your spot has been passed to the next person on the waitlist.</p>

      <div class="info">
        <p>Still interested? You can rejoin the waitlist and we'll notify you if another spot opens up.</p>
      </div>

      <div class="btn-wrap">
        <a href="${rejoinUrl}" class="btn">Rejoin Waitlist</a>
      </div>

      <p class="p-sm">We hope to see you at a future tournament.</p>
    </div>
    ${footer('This is an automated message from PB Draw.')}
  `);

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: `Registration Window Expired — ${eventName}`,
      html,
    });
    console.log('Waitlist expired email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending waitlist expired email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 8. Cancellation confirmation ────────────────────────────────────────────

export const sendCancellationConfirmationEmail = async ({ user, tournament, event, refundAmount }) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const html = wrap(`
    ${header('Registration Cancelled')}
    <div class="body">
      <div class="pill pill-grey">Cancelled</div>
      <div class="h1">Your registration has been cancelled.</div>
      <p class="p">Hi ${user.name} — your cancellation has been processed.</p>

      <div class="card">
        <div class="card-hdr"><span class="card-label">Cancellation Details</span></div>
        <div class="card-row"><span class="row-label">Tournament</span><span class="row-value">${tournament.name}</span></div>
        <div class="card-row"><span class="row-label">Event</span><span class="row-value">${event.name}</span></div>
        <div class="card-row"><span class="row-label">Refund Amount</span><span class="row-value">$${refundAmount.toFixed(2)}</span></div>
      </div>

      <div class="info">
        <p>Your refund of <strong>$${refundAmount.toFixed(2)}</strong> will be processed to your original payment method within 5–10 business days.</p>
      </div>

      <p class="p-sm">We're sorry to see you go. If you have any questions, please contact the tournament organizer directly.</p>
    </div>
    ${footer('PB Draw — Pickleball Tournament Management')}
  `);

  try {
    await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Cancellation Confirmed — ${tournament.name}`,
      html,
    });
  } catch (error) {
    console.error('Error sending cancellation confirmation email:', error);
  }
};

// ─── 9. Partner cancellation notice ──────────────────────────────────────────

export const sendPartnerNotificationEmail = async ({
  partner, cancelingPlayer, tournament, event, cancellation, deadline
}) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const responseLink = `${process.env.CLIENT_URL}/partner-response/${cancellation._id}`;
  const deadlineStr  = new Date(deadline).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const html = wrap(`
    ${header('Partner Cancellation Notice')}
    <div class="body">
      <div class="pill pill-amber">Action Required</div>
      <div class="h1">Your partner has cancelled.</div>
      <p class="p">Hi ${partner.name} — <strong>${cancelingPlayer.name}</strong> has requested to cancel their registration for <strong>${event.name}</strong> at <strong>${tournament.name}</strong>.</p>
      <p class="p">You have until <strong>${deadlineStr}</strong> to choose one of the two options below.</p>

      <div class="card">
        <div class="card-hdr"><span class="card-label">Your Options</span></div>
        <div class="card-row" style="display:block;padding:16px 20px;">
          <div class="h2" style="margin-bottom:6px;">Find a New Partner</div>
          <p class="p-sm" style="margin:0;">Keep your spot and find a new partner. Your original partner will receive their refund.</p>
        </div>
        <div class="card-row" style="display:block;padding:16px 20px;">
          <div class="h2" style="margin-bottom:6px;">Cancel &amp; Get a Refund</div>
          <p class="p-sm" style="margin:0;">Cancel your registration and receive a full refund within 5–10 business days.</p>
        </div>
      </div>

      <div class="btn-wrap">
        <a href="${responseLink}" class="btn">Make Your Decision</a>
      </div>

      <div class="info-amber">
        <p><strong>Deadline: ${deadlineStr}.</strong> If you don't respond, please contact the tournament organizer directly.</p>
      </div>
    </div>
    ${footer('PB Draw — Pickleball Tournament Management')}
  `);

  try {
    await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: partner.email,
      subject: `Action Required: Your Partner Cancelled — ${tournament.name}`,
      html,
    });
  } catch (error) {
    console.error('Error sending partner notification email:', error);
  }
};

// ─── 10. Partner refund confirmed ─────────────────────────────────────────────

export const sendPartnerRefundEmail = async ({ partner, tournament, event, refundAmount }) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const html = wrap(`
    ${header('Refund Confirmed')}
    <div class="body">
      <div class="pill pill-green">Refund Processed</div>
      <div class="h1">Your refund is on its way.</div>
      <p class="p">Hi ${partner.name} — your refund has been processed following your partner's cancellation.</p>

      <div class="card">
        <div class="card-hdr"><span class="card-label">Refund Details</span></div>
        <div class="card-row"><span class="row-label">Tournament</span><span class="row-value">${tournament.name}</span></div>
        <div class="card-row"><span class="row-label">Event</span><span class="row-value">${event.name}</span></div>
        <div class="card-row"><span class="row-label">Refund Amount</span><span class="row-value">$${refundAmount.toFixed(2)}</span></div>
      </div>

      <div class="info">
        <p>Refunds typically appear within 5–10 business days on your original payment method.</p>
      </div>

      <p class="p-sm">We hope to see you at a future tournament.</p>
    </div>
    ${footer('PB Draw — Pickleball Tournament Management')}
  `);

  try {
    await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: partner.email,
      subject: `Refund Processed — ${tournament.name}`,
      html,
    });
  } catch (error) {
    console.error('Error sending partner refund email:', error);
  }
};

// ─── 11. Bulk organizer communication ─────────────────────────────────────────

export const sendBulkCommunicationEmail = async ({
  to, recipientName, subject, message, tournamentName, organizerName
}) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const formatMessage = (msg) => msg
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px 0;">')
    .replace(/\n/g, '<br>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#1F4A2E;">$1</a>');

  const html = wrap(`
    ${header(tournamentName)}
    <div class="body">
      <p class="p">Hi ${recipientName || 'there'},</p>
      <div style="font-size:15px;color:#47443E;line-height:1.7;">
        <p style="margin:0 0 16px 0;">${formatMessage(message)}</p>
      </div>
      <div class="divider"></div>
      <div class="btn-wrap">
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>
      </div>
      <div class="org">
        <div class="org-label">Message from</div>
        <div class="org-name">${organizerName} — Tournament Organizer</div>
      </div>
    </div>
    ${footer(`This message was sent regarding your participation in ${tournamentName}.`)}
  `);

  const text = `${tournamentName}\n\nHi ${recipientName || 'there'},\n\n${message}\n\n---\nFrom: ${organizerName} — Tournament Organizer\n\n${process.env.CLIENT_URL}/dashboard`;

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Bulk communication email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending bulk communication email:', error);
    throw error;
  }
};

// ─── 12. Email verification ───────────────────────────────────────────────────

export const sendEmailVerificationEmail = async ({ to, name, verificationToken }) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  const html = wrap(`
    ${header('Verify Your Email')}
    <div class="body">
      <div class="pill pill-amber">Email Verification</div>
      <div class="h1">Confirm your email address.</div>
      <p class="p">Hi ${name} — please verify your email to complete your PB Draw account setup and unlock all features.</p>

      <div class="btn-wrap">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>

      <div class="info-amber">
        <p>This link expires in 24 hours. If you didn't create a PB Draw account, you can safely ignore this email.</p>
      </div>

      <div class="info">
        <p>If the button doesn't work, copy and paste this URL into your browser:<br>
        <span style="font-family:'Courier New',monospace;font-size:12px;word-break:break-all;color:#0F0F0E;">${verifyUrl}</span></p>
      </div>
    </div>
    ${footer('This is an automated message — please do not reply.')}
  `);

  const text = `PB Draw — Verify Your Email\n\nHi ${name},\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.\n\n© ${new Date().getFullYear()} PB Draw`;

  try {
    const info = await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your Email — PB Draw',
      text,
      html,
    });
    console.log('Email verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email verification email:', error);
    return { success: false, error: error.message };
  }
};

// ─── 13. Organizer-issued refund ──────────────────────────────────────────────

export const sendOrganizerRefundEmail = async ({
  user, tournament, event, refundAmount, reason, organizerName
}) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const html = wrap(`
    ${header('Refund Issued')}
    <div class="body">
      <div class="pill pill-green">Refund Issued</div>
      <div class="h1">A refund has been issued.</div>
      <p class="p">Hi ${user.name} — the tournament organizer has issued a refund for your registration.</p>

      <div class="card">
        <div class="card-hdr"><span class="card-label">Refund Details</span></div>
        <div class="card-row"><span class="row-label">Tournament</span><span class="row-value">${tournament.name}</span></div>
        <div class="card-row"><span class="row-label">Event</span><span class="row-value">${event.name}</span></div>
        <div class="card-row"><span class="row-label">Refund Amount</span><span class="row-value">$${refundAmount.toFixed(2)}</span></div>
        <div class="card-row"><span class="row-label">Issued By</span><span class="row-value">${organizerName}</span></div>
      </div>

      ${reason ? `<div class="info-amber"><p><strong>Reason:</strong> ${reason}</p></div>` : ''}

      <div class="info">
        <p>Refunds typically appear within 5–10 business days on your original payment method.</p>
      </div>

      <p class="p-sm">If you have questions, please contact the organizer directly.</p>
    </div>
    ${footer('PB Draw — Pickleball Tournament Management')}
  `);

  try {
    await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Refund Issued — ${tournament.name}`,
      html,
    });
  } catch (error) {
    console.error('Error sending organizer refund email:', error);
  }
};

// ─── 14. Tournament cancelled ─────────────────────────────────────────────────

export const sendTournamentCancelledEmail = async ({ user, tournament, refundAmount, reason }) => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Email service not configured' };

  const html = wrap(`
    ${header('Tournament Cancelled')}
    <div class="body">
      <div class="pill pill-red">Tournament Cancelled</div>
      <div class="h1">${tournament.name} has been cancelled.</div>
      <p class="p">Hi ${user.name} — we regret to inform you that this tournament has been cancelled by the organizer.</p>

      ${reason ? `<div class="info-red"><p><strong>Reason:</strong> ${reason}</p></div>` : ''}

      <div class="card">
        <div class="card-hdr"><span class="card-label">Full Refund Issued</span></div>
        <div class="card-row"><span class="row-label">Tournament</span><span class="row-value">${tournament.name}</span></div>
        <div class="card-row"><span class="row-label">Refund Amount</span><span class="row-value">$${refundAmount.toFixed(2)}</span></div>
      </div>

      <div class="info">
        <p>A full refund of <strong>$${refundAmount.toFixed(2)}</strong> has been issued and will appear on your original payment method within 5–10 business days.</p>
      </div>

      <div class="btn-wrap">
        <a href="${process.env.CLIENT_URL}/tournaments" class="btn">Browse Tournaments</a>
      </div>

      <p class="p-sm">We apologize for the inconvenience and hope to see you at a future event.</p>
    </div>
    ${footer('PB Draw — Pickleball Tournament Management')}
  `);

  try {
    await transport.sendMail({
      from: `"PB Draw" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Tournament Cancelled — ${tournament.name}`,
      html,
    });
  } catch (error) {
    console.error('Error sending tournament cancelled email:', error);
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
  sendEmailVerificationEmail,
  sendOrganizerRefundEmail,
  sendTournamentCancelledEmail,
};
