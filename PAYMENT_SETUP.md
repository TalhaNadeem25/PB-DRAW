# Payment System Setup Guide

This guide will help you set up and test the Stripe payment integration for tournament registrations.

## Phase 1: Full Payment (Currently Implemented)

In Phase 1, players pay the full entry fee when registering for a tournament event. Once payment is successful, their team is automatically confirmed.

---

## Prerequisites

1. **Stripe Account**: Create a free account at [stripe.com](https://stripe.com)
2. **Test API Keys**: Get your test keys from the Stripe Dashboard

---

## Setup Instructions

### Step 1: Get Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_...`)
4. Copy your **Secret key** (starts with `sk_test_...`)

### Step 2: Configure Backend Environment Variables

1. Navigate to the `backend` folder
2. Open (or create) the `.env` file
3. Add your Stripe secret key:

```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
```

### Step 3: Configure Frontend Environment Variables

1. Navigate to the root project folder
2. Open (or create) the `.env` file
3. Add your Stripe publishable key:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
```

### Step 4: Restart Your Development Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
npm run dev
```

---

## Testing the Payment Flow

### Test Card Numbers

Stripe provides test card numbers for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Card declined |
| `4000 0000 0000 0069` | Charge expires before capture |

For all test cards:
- **Expiry Date**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Step-by-Step Testing

#### 1. Create a Tournament with Entry Fee

1. Login as an **Organizer** or **Admin**
2. Navigate to **Create Tournament**
3. Fill in tournament details
4. **Set Entry Fee** (e.g., $50.00)
5. Create the tournament

#### 2. Create an Event

1. Go to the tournament detail page
2. Create an event (Singles, Doubles, or Mixed Doubles)
3. Set the event as "Open for Registration"

#### 3. Register for the Event

1. Login as a **Player**
2. Navigate to **Discover** or **Tournaments**
3. Find the tournament and click **Register**
4. Select the event you want to join

#### 4. Complete Team Creation

- **For Singles**: Team is created automatically
- **For Doubles/Mixed**:
  - Enter partner details (optional)
  - Click "Create Team"

#### 5. Complete Payment

After team creation, if the tournament has an entry fee:

1. **Payment Dialog** appears automatically
2. Review the payment summary
3. Enter test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
4. Click **Pay $XX.XX**
5. Wait for confirmation

#### 6. Verify Registration

Upon successful payment:
- Success toast notification appears
- You're redirected to the **Dashboard**
- Team status changes to "Paid" and "Confirmed"
- Payment record is created

---

## Verify Payment in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/payments)
2. You should see your test payment listed
3. Click on the payment to view details
4. Verify the amount and metadata

---

## Payment Flow Architecture

### Backend Components

1. **Payment Model** (`backend/src/models/Payment.js`)
   - Stores payment records
   - Links to User, Team, Event, and Tournament
   - Tracks Stripe payment intent and charge IDs

2. **Team Model Updates** (`backend/src/models/Team.js`)
   - Added payment tracking fields:
     - `paymentStatus`: unpaid, partially_paid, paid
     - `paymentAmount`: Total amount required
     - `paidAmount`: Amount paid so far
     - `registrationConfirmed`: True when payment complete

3. **Payment Controller** (`backend/src/controllers/paymentController.js`)
   - `createPaymentIntent`: Creates Stripe payment intent
   - `confirmPayment`: Confirms payment and updates team status
   - `getPayment`: Retrieve payment details
   - `getMyPayments`: User's payment history
   - `refundPayment`: Process refunds (admin/organizer only)

4. **Payment Routes** (`backend/src/routes/paymentRoutes.js`)
   - `POST /api/payments/create-intent`: Create payment intent
   - `POST /api/payments/confirm`: Confirm payment
   - `GET /api/payments/my-payments`: Get user payments
   - `GET /api/payments/:id`: Get single payment
   - `POST /api/payments/:id/refund`: Refund payment

### Frontend Components

1. **PaymentForm** (`src/components/payment/PaymentForm.tsx`)
   - Stripe Elements integration
   - Card input form
   - Payment submission and confirmation

2. **Register Page Updates** (`src/pages/Register.tsx`)
   - Integrated payment dialog
   - Automatic payment flow after team creation
   - Success/cancel handlers

3. **PaymentSuccess Page** (`src/pages/PaymentSuccess.tsx`)
   - Payment confirmation page
   - Redirect destination for Stripe

---

## API Endpoints

### Create Payment Intent

```http
POST /api/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": "team_id_here",
  "eventId": "event_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "amount": 50,
    "paymentId": "payment_id",
    "requiresPayment": true
  }
}
```

### Confirm Payment

```http
POST /api/payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "payment": { ... },
    "team": { ... }
  }
}
```

---

## Troubleshooting

### Issue: "Stripe key is undefined"

**Solution**: Make sure you've added your Stripe keys to the environment files and restarted both servers.

### Issue: Payment dialog doesn't appear

**Solution**:
1. Check that the tournament has an entry fee set
2. Verify the team was created successfully
3. Check browser console for errors

### Issue: Payment fails with "Invalid API key"

**Solution**:
1. Verify your Stripe secret key in `backend/.env`
2. Make sure the key starts with `sk_test_`
3. Restart the backend server

### Issue: Payment succeeds but team not confirmed

**Solution**:
1. Check backend logs for errors
2. Verify the `confirmPayment` endpoint was called
3. Check the Payment and Team records in MongoDB

---

## Future Enhancements (Phase 2)

Phase 2 will include:
- **Split Payment**: Partners can split the entry fee
- **Partner Payment Invitations**: Send payment requests to partners
- **Payment Deadlines**: Set deadlines for partner payments
- **Automatic Refunds**: Refund if partner doesn't pay by deadline
- **Payment History**: Detailed payment tracking and receipts

---

## Security Notes

### Production Checklist

Before going to production:

1. **Switch to Live Keys**:
   - Replace `pk_test_...` with `pk_live_...`
   - Replace `sk_test_...` with `sk_live_...`

2. **Enable Webhook Security**:
   - Set up Stripe webhooks for payment events
   - Verify webhook signatures

3. **Review Stripe Settings**:
   - Configure business information
   - Set up payout schedule
   - Enable fraud prevention tools

4. **Test Refund Flow**:
   - Test the refund functionality
   - Verify refund notifications

5. **Monitor Payments**:
   - Set up Stripe email notifications
   - Monitor payment failures and disputes

---

## Support

For Stripe-related issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Support](https://support.stripe.com)

For application issues:
- Check the GitHub repository issues
- Review backend logs
- Check browser console for frontend errors

---

## Summary

You've successfully integrated Stripe payments into your tournament registration system! Players can now pay entry fees securely, and organizers can track payments through the Stripe Dashboard and the application.

**Next Steps:**
1. Test the complete flow with test cards
2. Verify payments in Stripe Dashboard
3. Test edge cases (declined cards, expired cards, etc.)
4. Prepare for Phase 2 (split payments)
