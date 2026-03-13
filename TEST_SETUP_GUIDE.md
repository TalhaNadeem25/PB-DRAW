# Quick Test Setup Guide

## 1. Stripe Test Mode Setup (5 minutes)

### Get Your Test Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)
4. Add to your `.env` file:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

### Set Up Connected Accounts
For organizers to receive payments:
1. Go to https://dashboard.stripe.com/test/connect/accounts/overview
2. Click "Create account" for test connected account
3. Note: In test mode, accounts are automatically verified

## 2. Test Credit Cards (Stripe Provided)

### Always Work
```
Card Number: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Specific Scenarios
| Scenario | Card Number | Result |
|----------|-------------|---------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| Insufficient Funds | 4000 0000 0000 9995 | Insufficient funds |
| Expired Card | 4000 0000 0000 0069 | Expired card |
| Processing Error | 4000 0000 0000 0119 | Processing error |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |

## 3. Test User Accounts

Create these test accounts:

### Regular User 1
- **Email:** player1@test.com
- **Password:** Test123!
- **Name:** John Player
- **Role:** Player

### Regular User 2
- **Email:** player2@test.com
- **Password:** Test123!
- **Name:** Jane Competitor
- **Role:** Player

### Tournament Organizer
- **Email:** organizer@test.com
- **Password:** Test123!
- **Name:** Tournament Organizer
- **Role:** Organizer
- **Note:** Must complete Stripe Connect onboarding

### Admin
- **Email:** admin@test.com
- **Password:** Test123!
- **Name:** Admin User
- **Role:** Admin

## 4. Test Tournament Setup

### Tournament 1: Mixed Events
- **Name:** "Spring Championship 2025"
- **Location:** "Central Park Courts"
- **Dates:** Next month
- **Events:**
  - Men's Singles 4.0 - $25
  - Women's Singles 4.0 - $25
  - Men's Doubles 4.0 - $50
  - Mixed Doubles 3.5 - $50
  - Women's Doubles 4.0 - $50

### Tournament 2: Free Events
- **Name:** "Community Fun Day"
- **Location:** "Local Recreation Center"
- **Dates:** 2 months from now
- **Events:**
  - Open Singles - $0
  - Open Doubles - $0
  - Mixed Doubles - $0

### Tournament 3: Capacity Testing
- **Name:** "Small Tournament"
- **Location:** "Test Venue"
- **Dates:** 3 weeks from now
- **Events:**
  - Singles (maxTeams: 2) - $20
  - Doubles (maxTeams: 3) - $40

## 5. Quick Test Scenarios

### Scenario A: Simple Singles Registration
```
User: player1@test.com
Action:
1. Login
2. Browse "Spring Championship 2025"
3. Click "Register"
4. Select "Men's Singles 4.0"
5. Proceed to checkout
6. Pay with 4242 4242 4242 4242
7. Verify success

Expected:
- No team created
- Player in event.registeredPlayers
- Payment successful
- Confirmation email sent
```

### Scenario B: Doubles with Partner
```
User: player1@test.com
Action:
1. Login
2. Browse "Spring Championship 2025"
3. Click "Register"
4. Select "Men's Doubles 4.0"
5. Enter Partner: "Bob Smith" / bob@test.com
6. Proceed to checkout
7. Pay with 4242 4242 4242 4242
8. Verify success

Expected:
- Team created: "John Player & Bob Smith"
- Invitation sent to bob@test.com
- Payment successful
- Team in event.teams
```

### Scenario C: Multi-Event (Critical!)
```
User: player1@test.com
Action:
1. Login
2. Browse "Spring Championship 2025"
3. Click "Register"
4. Select:
   - Men's Singles 4.0 ($25)
   - Men's Doubles 4.0 ($50) + Partner
   - Mixed Doubles 3.5 ($50) + Different Partner
5. Verify cart shows $125 total
6. Proceed to checkout
7. Verify payment breakdown shows all 3 events
8. Pay with 4242 4242 4242 4242
9. Verify success

Expected:
- 1 singles registration (no team)
- 2 teams created
- Total: $125
- All registrations confirmed
- 1 confirmation email with breakdown
```

### Scenario D: Duplicate Prevention
```
User: player1@test.com
Action:
1. Complete Scenario A (register for Men's Singles)
2. Go back to registration page
3. Try to select Men's Singles again

Expected:
- Event shows "Registered" badge
- Event is disabled/grayed out
- Clicking shows error toast
- Cannot add to cart
```

### Scenario E: Event Full
```
Setup: Create event with maxTeams: 2
Action:
1. User 1 registers (1/2 filled)
2. User 2 registers (2/2 - FULL)
3. User 3 tries to register

Expected:
- Event shows "Full" badge
- Event is disabled
- User 3 cannot select event
- Backend rejects if attempted
```

### Scenario F: Payment Failure
```
User: player1@test.com
Action:
1. Select any event
2. Proceed to checkout
3. Use card: 4000 0000 0000 0002 (declined)
4. Attempt payment

Expected:
- Payment fails
- Error message shown
- Registration created but unpaid
- User can retry payment later
- No confirmation email
```

### Scenario G: Mixed Free + Paid
```
User: player1@test.com
Action:
1. Browse "Community Fun Day"
2. Select all free events (3 events, $0 total)
3. Proceed to checkout

Expected:
- Skip payment entirely
- All registrations created immediately
- Marked as "paid" (no payment needed)
- Confirmation email sent
- Redirect to dashboard
```

## 6. Common Issues to Check

### Issue: "No teams created for singles"
**Check:**
- Open browser DevTools → Network tab
- Look for team creation API call
- Should NOT see `/events/{eventId}/teams` for singles
- Should see player in event.registeredPlayers in database

### Issue: "Payment not working"
**Check:**
- Console for errors
- Stripe publishable key in .env
- Stripe Connect account set up for organizer
- Network tab shows payment intent created
- Backend logs for payment errors

### Issue: "Shopping cart not updating"
**Check:**
- Click anywhere on event card
- Watch cart in sidebar update
- Check browser console for React errors
- Verify state management working

### Issue: "Duplicate registration allowed"
**Check:**
- Database for existing team/registration
- Frontend should disable event
- Backend should reject duplicate
- Check both team AND singles registrations

## 7. Database Inspection

### Check Singles Registration
```javascript
// MongoDB query
db.events.findOne({ name: "Men's Singles 4.0" })
// Look for registeredPlayers array
// Verify player._id matches user
// Verify paymentStatus is "paid"
```

### Check Team Registration
```javascript
// MongoDB query
db.teams.find({ event: ObjectId("eventId") })
// Verify team exists
// Verify players array contains user
// Verify paymentStatus is "paid"
```

### Check Payment
```javascript
// MongoDB query
db.payments.findOne({ user: ObjectId("userId") }).sort({ createdAt: -1 })
// Verify amount is correct
// Verify eventBreakdown has all events
// Verify isSingles flag set correctly
// Verify status is "completed"
```

## 8. API Testing with Postman/Insomnia

### Get Events
```
GET /api/tournaments/{tournamentId}/events
```

### Create Multi-Event Payment
```
POST /api/payments/create-multi-event-intent
Headers: Authorization: Bearer {token}
Body:
{
  "eventRegistrations": [
    { "eventId": "...", "teamId": "...", "isSingles": false },
    { "eventId": "...", "teamId": null, "isSingles": true }
  ]
}
```

### Confirm Payment
```
POST /api/payments/confirm
Headers: Authorization: Bearer {token}
Body:
{
  "paymentIntentId": "pi_..."
}
```

## 9. Monitoring During Testing

### Watch These
- Browser console (F12) for errors
- Network tab for failed requests
- Backend logs for server errors
- Stripe dashboard for payment events
- Email inbox for confirmations
- Database for data consistency

### Key Metrics
- Registration time: < 30 seconds end-to-end
- Payment processing: < 5 seconds
- Page load time: < 2 seconds
- Shopping cart updates: Instant
- Email delivery: < 2 minutes

## 10. Emergency Rollback Plan

If critical bug found:
1. **Stop new registrations:** Set all events to "registration-closed"
2. **Notify users:** Send email about temporary issue
3. **Fix bug:** Address critical issue
4. **Test fix:** Verify in staging/test environment
5. **Deploy:** Push fix to production
6. **Re-open:** Set events back to "registration-open"
7. **Communicate:** Notify users registration is back

### Contact for Issues
- Developer: [Your contact]
- Database backups: [Location]
- Stripe support: https://support.stripe.com
- Logs location: [Where logs are stored]

## 11. Test User Instructions

Give this to your test users:

```markdown
# Welcome Test User!

Thank you for helping test Picklix!

## Your Test Account
- Email: [provided separately]
- Password: [provided separately]

## What to Test
1. Register for at least one singles event
2. Register for at least one doubles event
3. Try registering for multiple events at once
4. Try to register for the same event twice (should fail)

## Test Credit Card
- Card: 4242 4242 4242 4242
- Exp: 12/34
- CVC: 123
- ZIP: 12345

**This is a TEST card - no real charges!**

## Report Bugs
When you find an issue, please tell us:
1. What you were trying to do
2. What you expected to happen
3. What actually happened
4. Screenshots if possible

## Questions?
Contact: [Your email/phone]

Thank you! 🎾
```

---

## Quick Start Commands

```bash
# Start backend
cd backend
npm run dev

# Start frontend (separate terminal)
cd ..
npm run dev

# Check if Stripe is configured
node -e "console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? 'Configured ✓' : 'Missing ✗')"

# Watch logs
tail -f backend/logs/error.log

# Clear test data (if needed)
# WARNING: This deletes all test data!
mongosh your-database "db.payments.deleteMany({}); db.teams.deleteMany({})"
```

---

Ready to test! Start with Scenarios A-C for the critical path, then move to edge cases. Good luck! 🚀
