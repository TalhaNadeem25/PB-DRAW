# Pre-Launch Checklist — Pickle Rally

Use this list before going live. Tick off as you complete each item.

---

## 1. Environment & deployment

- [ ] **Production API URL**  
  Set `VITE_API_URL` in Vercel (and in `.env.production` if you build locally) to your **production backend URL** (e.g. `https://api.yourdomain.com/api`). Right now it’s empty, so the app may call `localhost` in production.

- [ ] **Backend hosting**  
  Deploy the Node/Express backend somewhere that can run 24/7 (e.g. Railway, Render, Fly.io). Vercel is for the frontend only; the backend must be on a separate URL.

- [ ] **Stripe live keys (when taking real money)**  
  In PAYMENT_SETUP.md you’re told to switch to live keys. Until then, keep using **test** keys. When ready: set `VITE_STRIPE_PUBLISHABLE_KEY` (frontend) and `STRIPE_SECRET_KEY` (backend) to your **live** Stripe keys in production only.

- [ ] **Stripe webhooks (production)**  
  Configure a Stripe webhook in the Stripe Dashboard pointing to your production backend (e.g. `https://api.yourdomain.com/api/stripe/webhook`) for `checkout.session.completed`, `payment_intent.succeeded`, etc., so payments and refunds stay in sync even if the user closes the browser.

---

## 2. Security & auth

- [ ] **HTTPS everywhere**  
  Ensure both frontend and backend are served over HTTPS in production.

- [ ] **Secrets**  
  No API keys, Stripe keys, or DB URLs in the repo. Use Vercel env vars and your backend host’s env (e.g. Railway/Render env).

- [ ] **401 handling**  
  Already done: expired/invalid token clears storage and redirects to `/login`. Optional: preserve the current path and redirect back after login (e.g. `?redirect=/tournaments/123`).

- [ ] **Rate limiting**  
  Backend should rate-limit auth and payment endpoints (e.g. `express-rate-limit`) to reduce abuse and brute force.

---

## 3. Legal & trust

- [ ] **Privacy Policy & Terms**  
  You have `/privacy` and `/terms`. Ensure they’re linked in the footer and (if required) during signup or checkout. Review them for your actual data and payment flows.

- [ ] **Refund policy**  
  Clearly state refund rules (e.g. in Terms or a dedicated page) and in the tournament/registration flow so users know before paying.

---

## 4. Reliability & errors

- [ ] **Error boundary**  
  A React Error Boundary is added so a single component crash doesn’t blank the whole app; users see a fallback and can refresh or go home.

- [ ] **404 page**  
  You have `NotFound.tsx`; ensure it’s the catch-all route (`path="*"`) so unknown URLs show it.

- [ ] **API errors**  
  Important actions (register, pay, create tournament) already use toasts/mutations. Optionally add a global handler (e.g. axios interceptor) to show a generic “Something went wrong” for 500s so users aren’t left with no feedback.

---

## 5. Payments & money

- [ ] **Test full payment flow**  
  Run through: signup → create tournament → add event → registration → checkout (Stripe test card `4242 4242 4242 4242`) → confirm payment and ticket/registration state.

- [ ] **Organizer payouts**  
  If organizers receive payouts via Stripe Connect, confirm Connect is configured in production and test a small payout in test mode.

- [ ] **Refunds**  
  You have a Refunds panel; test issuing a refund and confirm it appears correctly in Stripe and in your app.

---

## 6. Data & backups

- [ ] **Database backups**  
  If using MongoDB Atlas (or similar), enable automated backups and know how to restore.

- [ ] **User data**  
  Ensure you only store what you need and that your Privacy Policy matches (e.g. email, name, payment-related data).

---

## 7. Optional but recommended

- [ ] **Error tracking**  
  Add Sentry (or similar) for frontend and/or backend to see real errors and performance after launch.

- [ ] **Analytics**  
  Add a simple analytics tool (e.g. Plausible, Posthog, or Google Analytics) to understand traffic and key actions (signups, registrations, tournaments created).

- [ ] **Email verification**  
  You have a VerifyEmail page; consider requiring verified email before allowing registration or payment to reduce fake signups and support load.

- [ ] **Documentation**  
  Add a short “Deploying Pickle Rally” section to the README (or a separate DEPLOYMENT.md) listing required env vars for frontend and backend so you (or a teammate) can redeploy later.

---

## 8. Final smoke test

- [ ] Create a new account on production.
- [ ] Create a tournament, add an event, add a pool, generate matches.
- [ ] Register for the event (test payment if using Stripe test).
- [ ] Enter scores from the Scores tab and/or Pool Management.
- [ ] Open the tournament as a “live” or public view and confirm brackets/schedule look correct.
- [ ] Test on a real phone (responsive + touch).

---

Once the items above that apply to you are done, you’re in good shape to launch. Prioritize: **production API URL**, **backend deployment**, **Stripe (test vs live + webhooks)**, **refund/terms**, and **one full payment + score flow test**.
