import Stripe from 'stripe';

// Initialize Stripe with lazy loading to ensure env vars are loaded
let stripeInstance;

const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

// Export the stripe instance
export default getStripe();
