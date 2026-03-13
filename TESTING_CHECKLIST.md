# Picklix - Comprehensive Testing Checklist

## Pre-Testing Setup

### Test Data Requirements
- [ ] Create test Stripe account (use Stripe test mode)
- [ ] Set up test credit cards (Stripe provides test card numbers)
- [ ] Create at least 3 test user accounts
- [ ] Create 2+ test tournaments with various configurations
- [ ] Create events with different formats (singles, doubles, mixed)
- [ ] Create events with different pricing ($0, $25, $50, $100)

### Test Card Numbers (Stripe Test Mode)
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`
- **Insufficient Funds:** `4000 0000 0000 9995`
- **Expired Card:** Use any past expiration date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

---

## 1. Tournament & Event Creation

### Basic Tournament Creation
- [ ] Create tournament with all required fields
- [ ] Create tournament with future dates
- [ ] Create tournament with past dates (should fail/warn)
- [ ] Create tournament with maxParticipants = 0 (should fail)
- [ ] Create tournament without entry fee (deprecated field)
- [ ] Edit existing tournament
- [ ] Delete tournament (should delete all events)

### Event Creation
- [ ] Create singles event with fee
- [ ] Create doubles event with fee
- [ ] Create mixed-doubles event with fee
- [ ] Create free event ($0 fee)
- [ ] Create event with maxTeams = 2 (minimum)
- [ ] Create event with very high maxTeams (1000+)
- [ ] Try to create event without selecting tournament (should fail)
- [ ] Edit existing event
- [ ] Delete event

### Edge Cases - Tournament/Event
- [ ] Create tournament with registration deadline in past
- [ ] Create tournament with startDate > endDate (should fail)
- [ ] Create event with negative entry fee (should fail)
- [ ] Create multiple events with same name in tournament
- [ ] Create tournament with special characters in name
- [ ] Create tournament with very long description (10,000+ chars)

---

## 2. User Registration & Authentication

### Account Creation
- [ ] Register new user with valid email
- [ ] Register with duplicate email (should fail)
- [ ] Register with invalid email format (should fail)
- [ ] Register with weak password (test password requirements)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Logout functionality
- [ ] Password reset flow

### Edge Cases - Auth
- [ ] SQL injection in email field
- [ ] XSS attempts in name/email fields
- [ ] Very long email (1000+ chars)
- [ ] Email with special characters
- [ ] Case sensitivity in email (test@example.com vs TEST@example.com)

---

## 3. Singles Event Registration (No Team)

### Basic Singles Registration
- [ ] Browse tournaments and view singles events
- [ ] Select a singles event
- [ ] Verify NO partner form appears
- [ ] Verify NO team creation happens
- [ ] Complete registration for free singles event
- [ ] Complete registration for paid singles event ($25)
- [ ] Verify player appears in event.registeredPlayers
- [ ] Verify NO team created in database

### Singles Payment Flow
- [ ] Register for paid singles event
- [ ] Verify payment modal shows correct amount
- [ ] Complete payment with test card 4242...
- [ ] Verify payment success message
- [ ] Verify player marked as "paid" in event
- [ ] Verify confirmation email sent
- [ ] Verify user redirected to dashboard
- [ ] Check user can see registered event in dashboard

### Edge Cases - Singles
- [ ] Try to register twice for same singles event (should fail)
- [ ] Register for singles event that becomes full during checkout
- [ ] Cancel payment midway (verify registration stays as unpaid)
- [ ] Register for multiple singles events in one checkout
- [ ] Mix singles + doubles in same checkout
- [ ] Register when event has exactly 1 spot left
- [ ] Register after someone else takes last spot (race condition)

---

## 4. Doubles/Mixed-Doubles Registration (Team)

### Basic Team Registration
- [ ] Select doubles event
- [ ] Verify partner form appears inline
- [ ] Register WITHOUT entering partner info
- [ ] Register WITH partner name only
- [ ] Register WITH partner name + email
- [ ] Verify team created with user's name
- [ ] Verify team appears in event.teams
- [ ] Verify invitation sent if partner email provided
- [ ] Complete payment for doubles event
- [ ] Verify team marked as "paid"

### Partner Form Validation
- [ ] Leave partner fields empty (should work)
- [ ] Enter only partner name (should work)
- [ ] Enter invalid email format (should validate)
- [ ] Enter very long partner name (1000+ chars)
- [ ] Enter special characters in partner name
- [ ] Test partner email invitation functionality

### Edge Cases - Doubles
- [ ] Select doubles event, fill partner info, then deselect event
- [ ] Select multiple doubles events with different partners
- [ ] Click inside partner input fields (shouldn't toggle card selection)
- [ ] Register for doubles that becomes full during checkout
- [ ] Try to register twice for same doubles event (should fail)
- [ ] Create team with same partner for multiple events
- [ ] Register when partner is already in another team for same event

---

## 5. Multi-Event Registration (Shopping Cart)

### Basic Multi-Event Flow
- [ ] Select 2 singles events
- [ ] Select 2 doubles events
- [ ] Select 3 mixed events (singles + doubles + mixed)
- [ ] Verify shopping cart updates correctly
- [ ] Verify total calculates correctly
- [ ] Remove event from cart
- [ ] Add event back to cart
- [ ] Proceed to checkout with 3+ events
- [ ] Verify payment breakdown shows all events
- [ ] Complete payment
- [ ] Verify all registrations created correctly

### Shopping Cart Edge Cases
- [ ] Select 10+ events at once
- [ ] Select events, refresh page (cart should clear)
- [ ] Select events, navigate away, come back (cart should clear)
- [ ] Select all free events (should skip payment)
- [ ] Select mix of free + paid events
- [ ] Deselect all events and try to checkout (should show error)
- [ ] Select event that's already registered (should be disabled)

### Multi-Event Payment
- [ ] Pay for 2 singles events ($50 total)
- [ ] Pay for 2 doubles events ($100 total)
- [ ] Pay for 1 singles + 2 doubles ($75 total)
- [ ] Verify payment breakdown is correct
- [ ] Verify platform fee (10%) calculated correctly
- [ ] Verify all events marked as paid after success
- [ ] Verify confirmation email lists all events

---

## 6. Payment Testing (Critical!)

### Successful Payments
- [ ] Pay $25 (singles)
- [ ] Pay $50 (doubles)
- [ ] Pay $150 (3 events)
- [ ] Pay $0 (free events - should skip payment)
- [ ] Verify Stripe test mode is active
- [ ] Verify payment intent created
- [ ] Verify payment confirmed in backend
- [ ] Verify payment appears in user's payment history
- [ ] Verify organizer receives payment (minus platform fee)
- [ ] Verify platform fee deducted correctly

### Failed Payments
- [ ] Use declined card (4000 0000 0000 0002)
- [ ] Use insufficient funds card (4000 0000 0000 9995)
- [ ] Use expired card
- [ ] Verify error message shows
- [ ] Verify registration stays as "unpaid"
- [ ] Verify user can retry payment later
- [ ] Cancel payment dialog (verify can complete later)

### Payment Edge Cases
- [ ] Pay for event, organizer has no Stripe account (should fail gracefully)
- [ ] Pay for event, lose internet during payment
- [ ] Pay for event, close browser during payment
- [ ] Submit payment twice quickly (double-click protection)
- [ ] Pay for event that becomes full during payment
- [ ] Start payment, event price changes (should use locked price)
- [ ] Payment succeeds on Stripe but backend fails to confirm
- [ ] Payment in "processing" status for extended time

### Payment Dialog & UX
- [ ] Verify payment dialog is scrollable
- [ ] Verify can see all buttons on small screen
- [ ] Verify can scroll to bottom of payment form
- [ ] Test on mobile viewport (375px wide)
- [ ] Test payment form on tablet (768px wide)
- [ ] Verify Stripe elements load correctly
- [ ] Verify payment summary shows correct breakdown

---

## 7. Duplicate Registration Prevention

### Team-Based Duplicates
- [ ] Register for doubles event
- [ ] Try to register again (should show "Already Registered" badge)
- [ ] Try to click registered event (should show error toast)
- [ ] Verify checkbox is checked and disabled
- [ ] Create team, don't pay, try to register again (should fail)

### Singles-Based Duplicates
- [ ] Register for singles event
- [ ] Try to register again (should show "Already Registered" badge)
- [ ] Verify player in event.registeredPlayers
- [ ] Backend should reject duplicate registration

### Mixed Duplicates
- [ ] Register for event as team
- [ ] Try to register as singles for same event (should fail)
- [ ] Register as singles
- [ ] Try to register as team for same event (should fail)

### Backend Validation
- [ ] Direct API call to create duplicate team (should fail)
- [ ] Direct API call to register duplicate player (should fail)
- [ ] Try to bypass frontend validation with dev tools (backend should catch)

---

## 8. Event Capacity & Full Events

### Event Fills Up
- [ ] Create event with maxTeams = 2
- [ ] Register 2 teams (event should be full)
- [ ] Try to register 3rd team (should fail)
- [ ] Verify "Full" badge appears
- [ ] Verify event is disabled/grayed out
- [ ] Verify clicking full event shows appropriate message

### Race Conditions
- [ ] Have 2 users try to register for last spot simultaneously
- [ ] Event with 1 spot left, user adds to cart, someone else registers, user tries to checkout
- [ ] Event becomes full while user is on payment page
- [ ] Event becomes full after team created but before payment

### Capacity Edge Cases
- [ ] Event with maxTeams = 0 (should not be creatable)
- [ ] Event with maxTeams = 1
- [ ] Event with maxTeams = 1000
- [ ] currentTeams > maxTeams (shouldn't be possible, but test)
- [ ] Negative maxTeams (should fail)

---

## 9. Event Selection UX

### Card Click Behavior
- [ ] Click anywhere on event card to select
- [ ] Verify checkbox updates
- [ ] Verify card gets highlighted border
- [ ] Verify card background changes when selected
- [ ] Click again to deselect
- [ ] Verify hover effect works

### Partner Form Interaction
- [ ] Select doubles event
- [ ] Partner form appears
- [ ] Click inside partner name input (should NOT deselect event)
- [ ] Click inside partner email input (should NOT deselect event)
- [ ] Type in partner fields (should NOT deselect event)
- [ ] Click outside partner form but inside card (should NOT toggle)
- [ ] Click on card area outside partner form (should toggle)

### Disabled Events
- [ ] Full events should be grayed out
- [ ] Full events should show cursor-not-allowed
- [ ] Clicking full event does nothing
- [ ] Already registered events are disabled
- [ ] Already registered events show green badge

---

## 10. Platform Fee & Organizer Payouts

### Fee Calculation
- [ ] $100 event → $10 platform fee, $90 to organizer
- [ ] $50 event → $5 platform fee, $45 to organizer
- [ ] Multiple events → correct total platform fee
- [ ] Free event → $0 platform fee
- [ ] Verify fees in Stripe dashboard (test mode)

### Organizer Setup
- [ ] Organizer without Stripe Connect (should show error)
- [ ] Organizer with incomplete Stripe onboarding (should fail)
- [ ] Organizer with complete Stripe Connect (should work)
- [ ] Verify payment goes to organizer's connected account
- [ ] Verify platform fee goes to platform account

---

## 11. Email Notifications

### Payment Confirmation Emails
- [ ] Single event registration → 1 email
- [ ] Multi-event registration → 1 email with breakdown
- [ ] Free event registration → confirmation email
- [ ] Email contains correct event names
- [ ] Email contains correct amounts
- [ ] Email contains transaction ID
- [ ] Email has correct recipient
- [ ] Email sent within reasonable time

### Email Edge Cases
- [ ] User with invalid email (shouldn't block registration)
- [ ] Email service down (shouldn't block payment)
- [ ] Very long event name in email
- [ ] Special characters in event name
- [ ] 10+ events in single email

---

## 12. Dashboard & User History

### My Teams/Registrations
- [ ] View all registered teams
- [ ] View all singles registrations
- [ ] Teams show correct event info
- [ ] Payment status shown correctly
- [ ] Can view team details
- [ ] Can see partner information
- [ ] Can see payment history

### Payment History
- [ ] View all past payments
- [ ] Payments show correct amounts
- [ ] Payments show correct events
- [ ] Payments show correct status
- [ ] Can see payment breakdown for multi-event
- [ ] Failed payments appear with correct status

---

## 13. Mobile & Responsive Testing

### Mobile Devices (320px - 480px)
- [ ] Tournament listing page
- [ ] Event registration page
- [ ] Shopping cart is usable
- [ ] Partner forms work on mobile
- [ ] Payment dialog is scrollable
- [ ] Can complete full registration flow
- [ ] Touch targets are large enough
- [ ] No horizontal scroll

### Tablet (768px - 1024px)
- [ ] All pages render correctly
- [ ] Shopping cart sidebar appropriate size
- [ ] Event cards display properly
- [ ] Payment modal fits screen

### Desktop (1920px+)
- [ ] Layout doesn't stretch too wide
- [ ] Sidebar appropriate width
- [ ] Event cards max-width respected

---

## 14. Security Testing

### Input Validation
- [ ] SQL injection attempts in all forms
- [ ] XSS attempts (script tags in inputs)
- [ ] CSRF protection on payments
- [ ] Rate limiting on payment endpoints
- [ ] Auth token validation

### Authorization
- [ ] User can't register for events without login
- [ ] User can't access other users' teams
- [ ] User can't modify other users' registrations
- [ ] User can't view other users' payment info
- [ ] Organizer can only manage their tournaments

### Payment Security
- [ ] Payment requires authentication
- [ ] Can't create payment for another user's team
- [ ] Can't confirm someone else's payment
- [ ] Stripe keys are in environment variables (not hardcoded)
- [ ] Payment intents have metadata for tracking

---

## 15. Error Handling & Edge Cases

### Network Errors
- [ ] Registration while offline
- [ ] Payment while offline
- [ ] Slow network during payment
- [ ] API timeout during team creation
- [ ] API timeout during payment confirmation

### Data Edge Cases
- [ ] Event with no name
- [ ] Tournament with no events
- [ ] User with no registrations
- [ ] Payment with $0 amount
- [ ] Payment with negative amount (shouldn't be possible)
- [ ] Very large payment ($10,000+)

### Concurrent Actions
- [ ] Two users registering simultaneously
- [ ] User deletes event while someone is registering
- [ ] Organizer changes price during registration
- [ ] Tournament cancelled during registration

---

## 16. Browser Compatibility

### Modern Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Older Browsers
- [ ] Chrome (1 version old)
- [ ] Safari on iOS 14+
- [ ] Test on actual mobile devices if possible

---

## 17. Performance Testing

### Load Testing
- [ ] 100+ events in tournament (page performance)
- [ ] 50+ items in shopping cart (if possible)
- [ ] Large payment history (100+ payments)
- [ ] Check for memory leaks during navigation
- [ ] API response times under load

### Optimization Checks
- [ ] Images load quickly
- [ ] Payment form loads quickly
- [ ] No unnecessary re-renders
- [ ] Stripe elements load time acceptable

---

## 18. Backward Compatibility

### Legacy Data
- [ ] Old payments with single team still work
- [ ] Old payments with tournament.entryFee still work
- [ ] Confirm payment works for old payment records
- [ ] Dashboard shows old registrations correctly
- [ ] Old EventRegistration.tsx page still works (if kept)

---

## 19. Admin/Organizer Features

### Tournament Management
- [ ] Create tournament as organizer
- [ ] Edit own tournament
- [ ] Can't edit other's tournament
- [ ] View registrations for own events
- [ ] View payments for own events
- [ ] Export participant list

### Refunds (if implemented)
- [ ] Organizer can refund payment
- [ ] Refund updates registration status
- [ ] Partial refund for multi-event payment
- [ ] Refund email sent to user

---

## 20. Critical Path Testing (End-to-End)

### Happy Path - Singles
1. [ ] User creates account
2. [ ] User logs in
3. [ ] User browses tournaments
4. [ ] User selects singles event
5. [ ] User proceeds to checkout
6. [ ] User completes payment
7. [ ] User receives confirmation email
8. [ ] User sees registration in dashboard
9. [ ] Payment appears in history
10. [ ] Organizer receives payout

### Happy Path - Doubles
1. [ ] User creates account
2. [ ] User logs in
3. [ ] User selects doubles event
4. [ ] User enters partner info
5. [ ] User proceeds to checkout
6. [ ] User completes payment
7. [ ] Team created successfully
8. [ ] Partner receives invitation
9. [ ] User sees team in dashboard
10. [ ] Payment successful

### Happy Path - Multi-Event
1. [ ] User logs in
2. [ ] User selects 1 singles + 2 doubles events
3. [ ] User enters partner info for both doubles
4. [ ] Cart shows 3 events, correct total
5. [ ] User proceeds to checkout
6. [ ] Payment breakdown shows all 3 events
7. [ ] User completes payment
8. [ ] All registrations created
9. [ ] Confirmation email with breakdown
10. [ ] Dashboard shows all registrations

---

## Test Results Template

For each test, document:
- **Test Case:** Brief description
- **Status:** ✅ Pass / ❌ Fail / ⚠️ Warning
- **Expected Result:** What should happen
- **Actual Result:** What actually happened
- **Screenshots:** If applicable
- **Notes:** Any observations or issues

---

## Priority Levels

### P0 - Critical (Must work before launch)
- User registration/login
- Event selection
- Payment processing
- Singles registration without team
- Doubles registration with team
- Duplicate prevention
- Email confirmations

### P1 - High (Should work before launch)
- Multi-event checkout
- Shopping cart UX
- Event capacity limits
- Mobile responsiveness
- Payment failure handling

### P2 - Medium (Nice to have)
- Edge case handling
- Performance optimization
- Older browser support
- Advanced error messages

### P3 - Low (Can fix after launch)
- Minor UI polish
- Non-critical edge cases
- Optional features

---

## Bug Report Template

When you find bugs, document them:

```markdown
## Bug #[Number]

**Severity:** Critical / High / Medium / Low

**Summary:** One-line description

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. Observe...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- User Type: Regular User
- Event Type: Singles/Doubles

**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Paste any console errors]

**Status:** Open / In Progress / Fixed / Won't Fix
```

---

## Pre-Deployment Checklist

Before giving to test users:
- [ ] All P0 tests pass
- [ ] 90%+ of P1 tests pass
- [ ] No critical bugs remaining
- [ ] Stripe in test mode (or ready for production)
- [ ] Environment variables set correctly
- [ ] Database backed up
- [ ] Error logging configured
- [ ] Email service working
- [ ] Test user accounts created
- [ ] Documentation prepared for test users
- [ ] Rollback plan ready
- [ ] Monitoring/analytics set up

---

## Notes for Test Users

Provide test users with:
- [ ] Test account credentials
- [ ] Test credit card numbers
- [ ] List of scenarios to test
- [ ] Bug reporting process
- [ ] Expected completion date
- [ ] Contact for questions

Good luck with testing! 🚀
