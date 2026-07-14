import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import { fulfillPayment } from './paymentController.js';

// Separate Stripe client here (rather than reusing config/stripe.js's eager singleton)
// so a missing STRIPE_WEBHOOK_SECRET doesn't crash the whole app at import time.
let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// @desc    Handle Stripe webhook events
// @route   POST /api/payments/webhook
// @access  Public (verified via Stripe signature, not auth middleware)
//
// This is the source of truth for payment completion. The client also calls
// POST /api/payments/confirm right after checkout, but that call can be lost
// (closed tab, crashed app, dropped network) even though Stripe already charged
// the card. Without this webhook, a payment could be captured with no
// corresponding registration ever being marked paid, and no way to reconcile it.
export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured; rejecting webhook');
    return res.status(500).send('Webhook not configured');
  }

  let event;
  try {
    // req.body must be the raw request buffer (see express.raw() mounted on this route)
    // so Stripe can verify the signature against the exact bytes it signed.
    event = getStripe().webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id })
        .populate('team')
        .populate('teams')
        .populate('user', 'name email')
        .populate('event', 'name')
        .populate('events', 'name')
        .populate({
          path: 'tournament',
          populate: { path: 'organizer', model: 'User', select: 'name email' },
          select: 'name location startDate endDate organizer'
        });

      if (!payment) {
        console.error(`Webhook: no Payment found for PaymentIntent ${paymentIntent.id}`);
      } else if (payment.status === 'completed') {
        // Already fulfilled (e.g. by the client's /confirm call) — avoid double-processing.
        console.log(`Webhook: payment ${payment._id} already completed, skipping`);
      } else {
        const io = req.app.get('io');
        await fulfillPayment(payment, paymentIntent, io);
        console.log(`Webhook: fulfilled payment ${payment._id} for PaymentIntent ${paymentIntent.id}`);
      }
    }
    // Other event types (e.g. payment_intent.payment_failed) are not yet handled;
    // the /confirm endpoint already marks those payments 'failed' on the client's next check.

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook event:', err);
    // Return 500 so Stripe retries delivery instead of considering it delivered.
    res.status(500).send('Webhook handler error');
  }
};
