# Stripe Connect Setup - COMPLETE! ✅

## What's Been Implemented

### Backend (✅ Complete)

1. **Database Models Updated**
   - `User` model: Added `stripeConnectAccountId`, `stripeConnectOnboarded`, `stripeConnectOnboardingCompleted`
   - `Tournament` model: Added `stripeAccountId`, `platformFeePercent` (default 10%)

2. **Stripe Connect Controller** (`backend/src/controllers/stripeConnectController.js`)
   - `createConnectAccountLink()` - Creates Stripe Express account and onboarding link
   - `getConnectAccountStatus()` - Checks if organizer has completed onboarding
   - `createDashboardLink()` - Generates login link to Stripe dashboard
   - `disconnectAccount()` - Removes Stripe connection

3. **Routes** (`backend/src/routes/stripeConnectRoutes.js`)
   - `POST /api/stripe/connect/onboard` - Start onboarding (organizers only)
   - `GET /api/stripe/connect/status` - Check connection status
   - `GET /api/stripe/connect/dashboard` - Get dashboard link
   - `DELETE /api/stripe/connect/disconnect` - Disconnect account

4. **Payment Controller Updated** (`backend/src/controllers/paymentController.js`)
   - Now uses **Platform model** (direct charges)
   - Checks if organizer has completed Stripe onboarding
   - Calculates and applies platform fee (default 10%)
   - Payment goes directly to organizer's Stripe account
   - Platform fee automatically deducted by Stripe

### Frontend (✅ Complete)

1. **ConnectAccountButton Component** (`src/components/stripe/ConnectAccountButton.tsx`)
   - Initiates Stripe onboarding flow
   - Redirects to Stripe's hosted onboarding page
   - Loading states and error handling

2. **ConnectAccountStatus Component** (`src/components/stripe/ConnectAccountStatus.tsx`)
   - Shows onboarding status (not connected, partial, complete)
   - Displays account capabilities (charges, payouts)
   - "View Dashboard" button to access Stripe
   - Handles return from Stripe onboarding
   - Shows missing information if onboarding incomplete

## How to Use

### For Organizers

#### 1. Add to Dashboard

Edit `src/pages/Dashboard.tsx` and add:

```typescript
import { ConnectAccountStatus } from '@/components/stripe/ConnectAccountStatus';
import { useAuth } from '@/contexts/AuthContext';

// Inside the Dashboard component
const { user } = useAuth();

// Add this section for organizers
{user?.role === 'organizer' && (
  <div className="mb-6">
    <h2 className="text-2xl font-bold mb-4">Payment Setup</h2>
    <ConnectAccountStatus />
  </div>
)}
```

#### 2. Onboarding Flow

1. Organizer clicks "Connect Stripe Account"
2. Redirected to Stripe's onboarding page
3. Fills out:
   - Business details
   - Bank account info
   - Identity verification
4. Redirected back to dashboard
5. Status shows "Connected" ✅

#### 3. Receive Payments

Once connected:
- Players pay for tournaments
- Money goes directly to organizer's Stripe account
- Platform takes 10% fee automatically
- Payouts to bank in 2 business days

### For Platform Admin

#### Check Onboarding Status

```bash
curl -X GET http://localhost:5000/api/stripe/connect/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "connected": true,
  "onboarded": true,
  "accountId": "acct_xxxxx",
  "chargesEnabled": true,
  "payoutsEnabled": true
}
```

#### View Organizer's Dashboard

```bash
curl -X GET http://localhost:5000/api/stripe/connect/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Payment Flow

### Before (Old System)
```
Player → Platform → Manual payout to organizer
```

### Now (Stripe Connect)
```
Player pays $50
    ↓
Stripe processes payment
    ↓
Goes to Organizer's Stripe account
    ↓
Platform fee: $5 (10%) → Platform account
    ↓
Organizer receives: $45
    ↓
Auto-payout to organizer's bank (2 days)
```

## Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
npm run dev
# or use START_DEV.bat
```

### 3. Test Flow

1. **Create organizer account**
   - Sign up with role="organizer"

2. **Go to Dashboard**
   - Should see "Payment Setup Required" card

3. **Click "Connect Stripe Account"**
   - Redirects to Stripe onboarding (test mode)

4. **Complete Onboarding**
   - Use test data:
     - Business type: Individual
     - SSN: 000-00-0000
     - Bank account: Use "Test" routing number
   - Submit

5. **Return to Dashboard**
   - Should show "Stripe Account Connected" ✅

6. **Create Tournament**
   - Set entry fee
   - Publish tournament

7. **Test Payment**
   - Register as player
   - Pay with test card: 4242 4242 4242 4242
   - Payment should succeed
   - Check Stripe dashboard - payment should appear

## Environment Variables

Make sure these are set in `backend/.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
CLIENT_URL=http://localhost:8080
```

## Next Steps

### Required Before Launch

- [ ] Test full payment flow end-to-end
- [ ] Add Stripe Connect status to tournament creation
- [ ] Prevent tournament publishing if organizer not onboarded
- [ ] Add instructions for organizers
- [ ] Test refund flow
- [ ] Test with real Stripe account (not test mode)
- [ ] Set platform fee percentage (currently 10%)
- [ ] Add terms of service for platform fee

### Optional Enhancements

- [ ] Allow organizers to set custom platform fee
- [ ] Show earnings dashboard for organizers
- [ ] Email notifications for payments
- [ ] Webhook handlers for payment events
- [ ] Support for multiple currencies
- [ ] Monthly payouts option

## Troubleshooting

### "Tournament organizer has not completed Stripe setup"

**Problem**: Player tries to pay but organizer hasn't connected Stripe.

**Solution**: Organizer must complete Stripe onboarding before publishing tournament.

### "Stripe onboarding keeps redirecting back"

**Problem**: Organizer completes onboarding but status still shows incomplete.

**Solution**: Check `backend/.env` - `CLIENT_URL` must match exactly (no trailing slash!).

### Platform fee not appearing

**Problem**: Full amount goes to organizer.

**Solution**: Check `platformFeePercent` in Tournament model. Update with:
```javascript
tournament.platformFeePercent = 10; // 10% fee
await tournament.save();
```

### Payments failing

**Problem**: "No such destination" error.

**Solution**: Organizer's Stripe account was deleted or disconnected. They must reconnect.

## API Reference

### POST /api/stripe/connect/onboard

Start Stripe onboarding.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/...",
  "accountId": "acct_xxxxx"
}
```

### GET /api/stripe/connect/status

Check connection status.

**Response:**
```json
{
  "success": true,
  "connected": true,
  "onboarded": true,
  "accountId": "acct_xxxxx",
  "chargesEnabled": true,
  "payoutsEnabled": true
}
```

### GET /api/stripe/connect/dashboard

Get Stripe dashboard login link.

**Response:**
```json
{
  "success": true,
  "url": "https://connect.stripe.com/express/..."
}
```

## Support

For questions or issues:
1. Check Stripe dashboard for payment details
2. Review server logs for errors
3. Test with Stripe test mode first
4. Refer to [Stripe Connect docs](https://stripe.com/docs/connect)

## Summary

✅ **Backend**: Fully implemented with Platform model
✅ **Frontend**: Components created and ready to use
✅ **Payment Flow**: Direct charges to organizer accounts
✅ **Platform Fee**: Automatic 10% deduction

**Status**: Ready for testing! 🎉

Just add the `ConnectAccountStatus` component to the organizer dashboard and you're good to go!
