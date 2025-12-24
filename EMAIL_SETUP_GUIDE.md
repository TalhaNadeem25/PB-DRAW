# Email System Setup Guide

## Overview

The Pickle Rally platform now includes an automated email system that sends transactional emails to users. Currently implemented:

- ✅ **Ticket Purchase Confirmation** - Sent when a player successfully pays for tournament entry
- ✅ **Welcome Email** - Ready to use for new user registrations

## Features

- Beautiful HTML email templates with responsive design
- Automatic email sending after successful payment
- Graceful fallback - payment succeeds even if email fails
- Support for multiple email providers (Gmail, Outlook, SendGrid, custom SMTP)
- Easy to enable/disable via environment variable

## Setup Instructions

### Option 1: Using Gmail (Recommended for Development)

Gmail is the easiest option for development and small-scale deployments.

#### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/security
2. Enable 2-factor authentication (required for app passwords)

#### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device, enter "Pickle Rally"
4. Click "Generate"
5. Copy the 16-character password (no spaces)

#### Step 3: Configure Environment Variables

Edit `backend/.env`:

```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your 16-character app password
EMAIL_FROM=your-email@gmail.com
```

**IMPORTANT:**
- Use the App Password, NOT your regular Gmail password!
- Remove spaces from the app password

#### Step 4: Test

Start your server and make a test payment. You should receive an email!

### Option 2: Using Outlook/Hotmail

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
EMAIL_FROM=your-email@outlook.com
```

### Option 3: Using SendGrid (Recommended for Production)

SendGrid is a professional email service with excellent deliverability.

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create an API key in Settings > API Keys
3. Configure:

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your_sendgrid_api_key_here
EMAIL_FROM=noreply@yourdomain.com  # Must be verified in SendGrid
```

### Option 4: Custom SMTP Server

```env
EMAIL_ENABLED=true
EMAIL_HOST=mail.yourprovider.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_SECURE=false  # set to true if port 465
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

## Email Templates

### Ticket Purchase Confirmation

Sent automatically when a player completes payment for a tournament.

**Includes:**
- Tournament and event details
- Payment amount and transaction ID
- Event date (formatted nicely)
- Organizer contact information
- Link to user dashboard
- Beautiful responsive HTML design

**Trigger:** Automatically sent in `paymentController.js` after successful payment confirmation

**Preview:**

```
Subject: Registration Confirmed: [Tournament Name] - [Event Name]

Hi [Player Name],

Your registration for [Tournament Name] has been confirmed!

EVENT DETAILS:
- Tournament: Summer Pickleball Championship
- Event: Mixed Doubles
- Date: Saturday, August 15, 2025
- Entry Fee: $50.00
- Transaction ID: pi_xxxxxxxxxxxxx

ORGANIZER: John Doe (john@example.com)

[View My Tournaments Button]
```

### Welcome Email

Available for new user registrations (integrate in auth controller).

```javascript
import { sendWelcomeEmail } from '../services/emailService.js';

// After creating user:
await sendWelcomeEmail({
  to: user.email,
  name: user.name,
  role: user.role  // 'player' or 'organizer'
});
```

## Customizing Email Templates

Edit `backend/src/services/emailService.js` to customize:

### Change Email Styling

Modify the `<style>` section in the email HTML:

```javascript
const emailHtml = `
  <style>
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      // Change colors, fonts, etc.
    }
  </style>
`;
```

### Add New Email Types

1. Create a new export function in `emailService.js`:

```javascript
export const sendTournamentReminderEmail = async ({ to, tournamentName, eventDate }) => {
  const transport = getTransporter();
  if (!transport) return { success: false };

  const emailHtml = `
    <!-- Your HTML template here -->
  `;

  try {
    const info = await transport.sendMail({
      from: `"Pickle Rally" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: `Reminder: ${tournamentName} is tomorrow!`,
      html: emailHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error: error.message };
  }
};
```

2. Import and use it where needed:

```javascript
import { sendTournamentReminderEmail } from '../services/emailService.js';

await sendTournamentReminderEmail({
  to: 'player@example.com',
  tournamentName: 'Summer Championship',
  eventDate: new Date('2025-08-15')
});
```

## Disabling Emails

To disable email sending (for development/testing):

```env
EMAIL_ENABLED=false
```

The system will log "Email not sent - email service disabled" but won't fail.

## Troubleshooting

### "Email not sent - email service disabled"

**Solution:** Set `EMAIL_ENABLED=true` in `.env`

### "Email configuration incomplete"

**Solution:** Ensure all email variables are set:
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`

### "Email transporter verification failed"

**Possible causes:**

1. **Wrong credentials** - Double-check your email and password
2. **Using regular password instead of app password (Gmail)** - Generate an app password
3. **2FA not enabled (Gmail)** - Enable 2-factor authentication first
4. **Firewall blocking SMTP** - Check your firewall/antivirus settings
5. **Wrong host/port** - Verify SMTP settings with your provider

### Emails go to spam

**Solutions:**

1. **Use a verified domain** - SendGrid, Mailgun, etc.
2. **Add SPF/DKIM records** - Contact your email provider
3. **Use professional email service** - Gmail works for testing, but use SendGrid/Mailgun for production
4. **Avoid spam trigger words** - "Free", "Click here", excessive caps

### Gmail "Less secure apps" error

**Solution:** This feature is deprecated. Use App Passwords instead (see Setup Step 2).

## Testing Emails

### Test in Development

1. Enable emails: `EMAIL_ENABLED=true`
2. Configure with your email
3. Make a test payment through the app
4. Check your inbox!

### Test with Fake SMTP (No real emails)

Use a service like Mailtrap for testing:

1. Sign up at https://mailtrap.io
2. Get your SMTP credentials
3. Configure:

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_FROM=test@picklerally.com
```

All emails will be captured in Mailtrap's inbox (won't actually send).

## Production Checklist

Before going live:

- [ ] Switch from Gmail to professional service (SendGrid/Mailgun)
- [ ] Use a custom domain email (noreply@yourdomain.com)
- [ ] Set up SPF and DKIM records for your domain
- [ ] Test all email templates with real data
- [ ] Monitor email sending logs
- [ ] Set up email error alerts
- [ ] Consider email rate limits
- [ ] Implement email unsubscribe functionality (for marketing emails)

## Email Service Limits

### Gmail
- **Free:** ~500 emails/day
- **Google Workspace:** 2,000 emails/day
- **Best for:** Development, small events

### SendGrid
- **Free:** 100 emails/day forever
- **Essentials ($20/mo):** 50,000 emails/month
- **Best for:** Production, growing platforms

### Mailgun
- **Free:** 5,000 emails/month (3 months)
- **Pay-as-you-go:** $0.80/1000 emails
- **Best for:** Production, flexible pricing

### AWS SES
- **Free:** 62,000 emails/month (if sending from EC2)
- **Paid:** $0.10/1000 emails
- **Best for:** Large-scale production

## Integration with Other Features

### Send Welcome Email on Registration

Edit `backend/src/controllers/authController.js`:

```javascript
import { sendWelcomeEmail } from '../services/emailService.js';

// In the register function, after user is created:
try {
  await sendWelcomeEmail({
    to: user.email,
    name: user.name,
    role: user.role
  });
} catch (error) {
  console.error('Welcome email failed:', error);
  // Don't fail registration if email fails
}
```

### Tournament Reminder Emails

Create a scheduled job (using node-cron):

```javascript
import cron from 'node-cron';
import { sendTournamentReminderEmail } from '../services/emailService.js';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find tournaments starting tomorrow
  const tournaments = await Tournament.find({
    startDate: {
      $gte: tomorrow.setHours(0,0,0,0),
      $lt: tomorrow.setHours(23,59,59,999)
    }
  }).populate('participants');

  // Send reminder to each participant
  for (const tournament of tournaments) {
    for (const participant of tournament.participants) {
      await sendTournamentReminderEmail({
        to: participant.email,
        tournamentName: tournament.name,
        eventDate: tournament.startDate
      });
    }
  }
});
```

## Support

If you encounter issues:

1. Check server logs: `npm run dev` (backend)
2. Verify `.env` configuration
3. Test SMTP connection manually
4. Check email provider documentation
5. Review code in `backend/src/services/emailService.js`

## Summary

✅ **Email service configured and ready to use**
✅ **Ticket purchase emails sent automatically**
✅ **Easy to enable/disable**
✅ **Supports multiple email providers**
✅ **Graceful error handling**

Just add your email credentials, set `EMAIL_ENABLED=true`, and you're good to go!
