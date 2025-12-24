# Stripe Connect Implementation Guide

## Overview

Implement Stripe Connect to allow tournament organizers to receive payments directly while you (the platform) optionally take a fee.

## Architecture

```
Player pays $50 for tournament
    ↓
Platform creates payment intent
    ↓
Payment goes to Organizer's Stripe account ($50)
    ↓
Platform takes application fee ($5) [OPTIONAL]
    ↓
Organizer receives $45 in their bank account
```

## Step 1: Update Database Models

### Add Stripe Connect fields to User model

```javascript
// backend/src/models/User.js

const userSchema = new mongoose.Schema({
  // ... existing fields ...

  // Stripe Connect fields
  stripeConnectAccountId: {
    type: String,
    default: null
  },
  stripeConnectOnboarded: {
    type: Boolean,
    default: false
  },
  stripeConnectOnboardingCompleted: {
    type: Date,
    default: null
  },

  // Platform earnings tracking
  platformEarnings: {
    type: Number,
    default: 0
  }
});
```

### Add Stripe Account to Tournament model

```javascript
// backend/src/models/Tournament.js

const tournamentSchema = new mongoose.Schema({
  // ... existing fields ...

  stripeAccountId: {
    type: String,
    required: true,
    ref: 'User' // Reference to organizer's Stripe account
  },

  platformFeePercent: {
    type: Number,
    default: 10, // 10% platform fee (adjust as needed)
    min: 0,
    max: 100
  }
});
```

## Step 2: Backend - Stripe Connect Routes

### Create Stripe Connect Controller

```javascript
// backend/src/controllers/stripeConnectController.js

import Stripe from 'stripe';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe Connect account link
// @route   POST /api/stripe/connect/onboard
// @access  Private (Organizers only)
export const createConnectAccountLink = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let accountId = user.stripeConnectAccountId;

    // Create account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Change based on your target country
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      accountId = account.id;
      user.stripeConnectAccountId = accountId;
      await user.save();
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.CLIENT_URL}/dashboard?stripe_refresh=true`,
      return_url: `${process.env.CLIENT_URL}/dashboard?stripe_success=true`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      url: accountLink.url
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stripe Connect account status
// @route   GET /api/stripe/connect/status
// @access  Private
export const getConnectAccountStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.stripeConnectAccountId) {
      return res.json({
        success: true,
        connected: false,
        onboarded: false
      });
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

    const isOnboarded = account.details_submitted &&
                        account.charges_enabled &&
                        account.payouts_enabled;

    // Update user if onboarding completed
    if (isOnboarded && !user.stripeConnectOnboarded) {
      user.stripeConnectOnboarded = true;
      user.stripeConnectOnboardingCompleted = new Date();
      await user.save();
    }

    res.json({
      success: true,
      connected: true,
      onboarded: isOnboarded,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Stripe Connect dashboard link
// @route   GET /api/stripe/connect/dashboard
// @access  Private
export const createDashboardLink = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.stripeConnectAccountId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe account connected'
      });
    }

    const loginLink = await stripe.accounts.createLoginLink(
      user.stripeConnectAccountId
    );

    res.json({
      success: true,
      url: loginLink.url
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect Stripe account
// @route   DELETE /api/stripe/connect/disconnect
// @access  Private
export const disconnectAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.stripeConnectAccountId) {
      // Delete the connected account
      await stripe.accounts.del(user.stripeConnectAccountId);

      user.stripeConnectAccountId = null;
      user.stripeConnectOnboarded = false;
      user.stripeConnectOnboardingCompleted = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Stripe account disconnected'
    });
  } catch (error) {
    next(error);
  }
};
```

### Create Routes

```javascript
// backend/src/routes/stripeConnectRoutes.js

import express from 'express';
import {
  createConnectAccountLink,
  getConnectAccountStatus,
  createDashboardLink,
  disconnectAccount
} from '../controllers/stripeConnectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/onboard', protect, authorize('organizer', 'admin'), createConnectAccountLink);
router.get('/status', protect, getConnectAccountStatus);
router.get('/dashboard', protect, createDashboardLink);
router.delete('/disconnect', protect, disconnectAccount);

export default router;
```

### Add to server.js

```javascript
// backend/src/server.js

import stripeConnectRoutes from './routes/stripeConnectRoutes.js';

// ... other routes ...
app.use('/api/stripe/connect', stripeConnectRoutes);
```

## Step 3: Update Payment Flow

### Modify Payment Controller

```javascript
// backend/src/controllers/paymentController.js

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { eventId, teamId } = req.body;

    const event = await Event.findById(eventId).populate('tournament');
    const team = await Team.findById(teamId);
    const tournament = await Tournament.findById(event.tournament._id).populate('organizer');

    // Get organizer's Stripe account
    const organizer = tournament.organizer;

    if (!organizer.stripeConnectAccountId || !organizer.stripeConnectOnboarded) {
      return res.status(400).json({
        success: false,
        message: 'Tournament organizer has not set up payments yet'
      });
    }

    const amount = event.entryFee * 100; // Convert to cents
    const platformFeePercent = tournament.platformFeePercent || 10;
    const platformFee = Math.round(amount * (platformFeePercent / 100));

    // Create payment intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      application_fee_amount: platformFee, // Your platform fee
      transfer_data: {
        destination: organizer.stripeConnectAccountId, // Organizer receives payment
      },
      metadata: {
        eventId: eventId,
        teamId: teamId,
        tournamentId: tournament._id.toString(),
        organizerId: organizer._id.toString()
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      platformFee: platformFee,
      organizerReceives: amount - platformFee
    });
  } catch (error) {
    next(error);
  }
};
```

## Step 4: Frontend Components

### Stripe Connect Onboarding Button

```typescript
// src/components/stripe/ConnectAccountButton.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { toast } from 'sonner';

export const ConnectAccountButton = () => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await api.post('/stripe/connect/onboard');

      // Redirect to Stripe onboarding
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Failed to start Stripe onboarding');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={loading}>
      {loading ? 'Loading...' : 'Connect Stripe Account'}
    </Button>
  );
};
```

### Stripe Connect Status Component

```typescript
// src/components/stripe/ConnectAccountStatus.tsx

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import api from '@/services/api';
import { ConnectAccountButton } from './ConnectAccountButton';

export const ConnectAccountStatus = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: async () => {
      const response = await api.get('/stripe/connect/status');
      return response.data;
    }
  });

  const handleViewDashboard = async () => {
    try {
      const response = await api.get('/stripe/connect/dashboard');
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  if (!data.connected) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Setup Required</h3>
        <p className="text-muted-foreground mb-4">
          Connect your Stripe account to receive tournament payments directly to your bank account.
        </p>
        <ConnectAccountButton />
      </Card>
    );
  }

  if (!data.onboarded) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <XCircle className="text-orange-500" />
          Complete Stripe Onboarding
        </h3>
        <p className="text-muted-foreground mb-4">
          You've started connecting your Stripe account, but haven't completed the setup.
        </p>
        <ConnectAccountButton />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CheckCircle className="text-green-500" />
        Stripe Account Connected
      </h3>
      <p className="text-muted-foreground mb-4">
        Your Stripe account is connected and ready to receive payments.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleViewDashboard} variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          View Dashboard
        </Button>
      </div>
    </Card>
  );
};
```

### Add to Organizer Dashboard

```typescript
// src/pages/Dashboard.tsx (for organizers)

import { ConnectAccountStatus } from '@/components/stripe/ConnectAccountStatus';

// Inside the dashboard component
{user?.role === 'organizer' && (
  <div className="mb-6">
    <ConnectAccountStatus />
  </div>
)}
```

## Step 5: Environment Variables

Update your `.env` files:

```bash
# backend/.env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PLATFORM_ACCOUNT_ID=acct_your_platform_id

# .env (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

## Step 6: Middleware - Check Stripe Onboarding

```javascript
// backend/src/middleware/stripeConnect.js

export const requireStripeConnect = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId).populate('organizer');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const organizer = tournament.organizer;

    if (!organizer.stripeConnectOnboarded) {
      return res.status(400).json({
        success: false,
        message: 'Tournament organizer must complete Stripe setup before accepting payments',
        requiresStripeOnboarding: true
      });
    }

    req.stripeAccountId = organizer.stripeConnectAccountId;
    next();
  } catch (error) {
    next(error);
  }
};
```

## Step 7: Testing

### Test Mode Setup

1. Use Stripe test keys (sk_test_... and pk_test_...)
2. Test onboarding flow
3. Use test card: `4242 4242 4242 4242`
4. View test payments in Stripe dashboard

### Test Scenarios

- [ ] Organizer connects Stripe account
- [ ] Organizer completes onboarding
- [ ] Player makes payment to tournament
- [ ] Payment appears in organizer's Stripe account
- [ ] Platform fee is deducted correctly
- [ ] Organizer can view their Stripe dashboard
- [ ] Organizer can disconnect account

## Payment Flow Examples

### Scenario 1: $50 Tournament Entry with 10% Platform Fee

```
Player pays: $50.00
Platform fee: $5.00 (10%)
Organizer receives: $45.00
Stripe fee: ~$1.75 (2.9% + $0.30)
Organizer net: ~$43.25
```

### Scenario 2: No Platform Fee

```
Player pays: $50.00
Platform fee: $0.00
Organizer receives: $50.00
Stripe fee: ~$1.75
Organizer net: ~$48.25
```

## Key Considerations

### 1. Platform Fee Structure

**Options:**
- Fixed percentage (10%)
- Tiered based on tournament size
- Subscription model (no per-transaction fee)
- Freemium (free tournaments, paid features)

### 2. Payout Schedule

Stripe handles payouts automatically:
- Default: 2-day rolling basis
- Can be configured per account
- Weekly or monthly options available

### 3. Compliance

- Stripe handles 1099-K tax forms
- Platform doesn't need to track payments
- Organizers responsible for their taxes

### 4. Refunds

```javascript
// Refund goes back to platform, then to player
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  reverse_transfer: true, // Reverses transfer to organizer
});
```

### 5. Disputes

- Stripe handles disputes
- Organizer's account is debited
- Platform not responsible

## Migration Strategy

For existing organizers:

1. Add Stripe Connect fields to database
2. Email organizers about new feature
3. Require onboarding before next tournament
4. Grace period for existing tournaments
5. Support documentation

## Next Steps

1. Create Stripe Connect application at https://dashboard.stripe.com/settings/applications
2. Implement database migrations
3. Add Stripe Connect routes
4. Build frontend components
5. Test with Stripe test mode
6. Document for organizers
7. Go live!

## Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Destination Charges](https://stripe.com/docs/connect/destination-charges)
- [Platform Fees](https://stripe.com/docs/connect/direct-charges#collecting-fees)
