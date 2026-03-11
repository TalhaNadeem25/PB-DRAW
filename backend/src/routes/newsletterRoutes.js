import express from 'express';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const ADMIN_EMAIL = 'nadeemtalha24@gmail.com';

// POST /api/newsletter/subscribe — public
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({ success: true, message: "You're already subscribed!" });
    }

    await NewsletterSubscriber.create({ email: email.toLowerCase() });
    res.status(201).json({ success: true, message: 'Successfully subscribed!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Subscription failed' });
  }
});

// GET /api/newsletter/subscribers — only nadeemtalha24@gmail.com
router.get('/subscribers', protect, async (req, res) => {
  try {
    if (req.user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const subscribers = await NewsletterSubscriber.find().sort({ subscribedAt: -1 });
    res.json({ success: true, data: subscribers, total: subscribers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
  }
});

export default router;
