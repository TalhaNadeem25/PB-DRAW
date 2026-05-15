export const verifyTurnstile = async (req, res, next) => {
  // Native mobile apps (iOS/Android via Capacitor) skip Turnstile
  if (req.headers['x-app-platform'] === 'capacitor') {
    return next();
  }

  const token = req.body.turnstileToken;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Bot verification required. Please complete the challenge.' });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.ip,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error('Turnstile verification failed:', JSON.stringify(data));
      return res.status(400).json({ success: false, message: 'Bot verification failed. Please try again.' });
    }

    next();
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification service unavailable. Please try again.' });
  }
};
