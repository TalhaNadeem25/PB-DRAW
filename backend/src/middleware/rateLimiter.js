import rateLimit from 'express-rate-limit';

// Check if we're in development mode - more lenient limits for testing
const isDev = process.env.NODE_ENV !== 'production';

// General API rate limiter - generous for normal usage
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 500, // 500-1000 requests per 15 min
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter - applies to login/register/password reset
// More lenient since it also covers profile updates, stats, etc.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 200 : 100, // 100-200 requests per 15 min
  message: {
    success: false,
    message: 'Too many authentication requests. Try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict login limiter - specifically for failed login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50 : 10, // 10-50 failed attempts per 15 min
  skipSuccessfulRequests: true, // only count failed logins
  message: {
    success: false,
    message: 'Too many failed login attempts. Try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment rate limiter - organizers may need to process many payments
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 200 : 100, // 100-200 payment requests per hour
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tournament creation limiter - reasonable for organizers
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 100 : 50, // 50-100 creation requests per hour
  message: {
    success: false,
    message: 'Too many creation requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
