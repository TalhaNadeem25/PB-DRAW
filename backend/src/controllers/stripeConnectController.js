import Stripe from 'stripe';
import User from '../models/User.js';

// Initialize Stripe with lazy loading to ensure env vars are loaded
let stripe;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// @desc    Create Stripe Connect account link (Platform model)
// @route   POST /api/stripe/connect/onboard
// @access  Private (Organizers only)
export const createConnectAccountLink = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let accountId = user.stripeConnectAccountId;

    // Create account if doesn't exist
    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        // Pre-fill individual information to streamline onboarding
        individual: {
          email: user.email,
          first_name: user.name?.split(' ')[0] || undefined,
          last_name: user.name?.split(' ').slice(1).join(' ') || undefined,
        },
        // Customize onboarding to collect only essential information
        settings: {
          payouts: {
            debit_negative_balances: true,
            schedule: {
              interval: 'daily', // Fast payouts for organizers
            },
          },
        },
      });

      accountId = account.id;
      user.stripeConnectAccountId = accountId;
      await user.save();
    }

    // Create account link for onboarding
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.CLIENT_URL}/dashboard?stripe_refresh=true`,
      return_url: `${process.env.CLIENT_URL}/dashboard?stripe_success=true`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      url: accountLink.url,
      accountId: accountId
    });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);

    // Send detailed error for debugging
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create Stripe Connect account',
      stripeError: error.type,
      details: error.raw?.message || error.message
    });
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

    let account;
    try {
      account = await getStripe().accounts.retrieve(user.stripeConnectAccountId);
    } catch (stripeError) {
      // Account doesn't exist in this mode (e.g. test account used with live keys)
      // Clear the stale account ID so the user can reconnect
      user.stripeConnectAccountId = null;
      user.stripeConnectOnboarded = false;
      user.stripeConnectOnboardingCompleted = null;
      await user.save();
      return res.json({
        success: true,
        connected: false,
        onboarded: false,
        reconnectRequired: true,
      });
    }

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
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements
    });
  } catch (error) {
    console.error('Stripe status error:', error);
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

    const loginLink = await getStripe().accounts.createLoginLink(
      user.stripeConnectAccountId
    );

    res.json({
      success: true,
      url: loginLink.url
    });
  } catch (error) {
    console.error('Stripe dashboard link error:', error);
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
      // Only remove the link on our side — do NOT delete the Stripe account itself.
      // Deleting it is irreversible and would orphan the organizer's historical
      // payout/transfer records if they've already received real payouts through it.
      // If they reconnect later, createConnectAccountLink will just create a new one.
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
    console.error('Stripe disconnect error:', error);
    next(error);
  }
};
