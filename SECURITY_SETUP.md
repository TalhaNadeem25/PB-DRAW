# Security Setup Guide

## URGENT: Security Issues Fixed

Your `.env` files containing production credentials were previously tracked in git. This guide will help you rotate all secrets and secure your application.

## Steps to Complete

### 1. Remove .env Files from Git (COMPLETED ✓)

The following changes have been made:
- `.gitignore` updated to exclude all `.env` files
- `.env.example` templates created for both frontend and backend

**You still need to run:**
```bash
# Remove .env files from git tracking
git rm --cached .env
git rm --cached backend/.env

# Commit the changes
git add .gitignore .env.example backend/.env.example
git commit -m "Security: Remove .env files from git and add templates

- Remove .env files from version control
- Add comprehensive .env.example templates
- Update .gitignore to prevent future commits of environment files
"
```

### 2. Generate New Secure Secrets

#### JWT Secret (Backend)

**NEW JWT SECRET (use this):**
```
ef89f48efca8750780209ced85aa9c954e5b9b0c010f0fc505af06e6e4c1c85a8e5e4908e2e9c0bb94fe932644d4d2bcec79b72dd180138f1f5b0e385a02527d
```

**Update in:**
- Local `backend/.env`: `JWT_SECRET=ef89f48efca8750780209ced85aa9c954e5b9b0c010f0fc505af06e6e4c1c85a8e5e4908e2e9c0bb94fe932644d4d2bcec79b72dd180138f1f5b0e385a02527d`
- Vercel environment variables (see step 3)

#### MongoDB Password

**Action Required:**
1. Go to MongoDB Atlas: https://cloud.mongodb.com
2. Navigate to Database Access
3. Find user `personalwork425_db_user`
4. Click "Edit" → "Edit Password"
5. Generate a new secure password (or use auto-generate)
6. Update connection string in `.env` and Vercel

**Connection string format:**
```
MONGODB_URI=mongodb+srv://personalwork425_db_user:NEW_PASSWORD@cluster0.ypjgvcy.mongodb.net/?appName=Cluster0
```

#### Stripe API Keys

Your current keys are **test mode keys** - they're relatively safe but should still be rotated:

**Action Required:**
1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
2. Click "Create secret key" to generate a new test secret key
3. Copy the new secret key (starts with `sk_test_`)
4. The publishable key can remain the same or generate new one
5. Update in `.env` files and Vercel

**Before going live:**
- Switch to live mode keys (not test mode)
- Enable Stripe webhook signature verification

### 3. Update Vercel Environment Variables

Go to your Vercel project settings: https://vercel.com/your-project/settings/environment-variables

**Update these variables:**
```
JWT_SECRET=ef89f48efca8750780209ced85aa9c954e5b9b0c010f0fc505af06e6e4c1c85a8e5e4908e2e9c0bb94fe932644d4d2bcec79b72dd180138f1f5b0e385a02527d
MONGODB_URI=mongodb+srv://personalwork425_db_user:NEW_PASSWORD@cluster0.ypjgvcy.mongodb.net/?appName=Cluster0
STRIPE_SECRET_KEY=sk_test_NEW_KEY_HERE
```

**After updating:**
- Redeploy your application for changes to take effect
- Test authentication to ensure JWT secret is working

### 4. Update Local .env Files

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_NEW_KEY_OR_EXISTING
```

**Backend (backend/.env):**
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://personalwork425_db_user:NEW_PASSWORD@cluster0.ypjgvcy.mongodb.net/?appName=Cluster0

JWT_SECRET=ef89f48efca8750780209ced85aa9c954e5b9b0c010f0fc505af06e6e4c1c85a8e5e4908e2e9c0bb94fe932644d4d2bcec79b72dd180138f1f5b0e385a02527d
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:8080

STRIPE_SECRET_KEY=sk_test_NEW_KEY_HERE
```

### 5. Verify Changes

**Check git status:**
```bash
git status
# Should NOT show .env or backend/.env as tracked files
```

**Test locally:**
```bash
cd backend
npm run dev
# Should connect to database successfully

cd ..
npm run dev
# Should authenticate successfully
```

### 6. Security Checklist

- [ ] .env files removed from git (`git rm --cached`)
- [ ] Changes committed to repository
- [ ] New JWT secret generated and updated
- [ ] MongoDB password rotated
- [ ] Stripe keys rotated (or verified as test keys)
- [ ] Vercel environment variables updated
- [ ] Local .env files updated
- [ ] Application tested locally
- [ ] Application redeployed to Vercel
- [ ] Production authentication tested

## Additional Security Recommendations

### Immediately After This Setup:

1. **Never commit .env files again** - The .gitignore is now configured to prevent this
2. **Use test Stripe keys until launch** - Switch to live keys only when ready for production
3. **Rotate secrets periodically** - Especially after team member changes
4. **Use different secrets per environment** - Dev, staging, and production should have different credentials

### Future Enhancements:

1. **Secret Management Service** - Consider using Vercel's secret management or AWS Secrets Manager
2. **Webhook Signature Verification** - Implement Stripe webhook signature verification (already added to code)
3. **Rate Limiting** - Implement API rate limiting (in progress)
4. **Security Headers** - Already using Helmet.js, review configuration
5. **Input Sanitization** - Add express-mongo-sanitize and xss-clean (recommended)

## Questions or Issues?

If you encounter any issues during this process:
1. Keep your old credentials until new ones are verified working
2. Test in development environment first
3. Check Vercel deployment logs for errors
4. Verify MongoDB connection strings are correct (no extra spaces, proper encoding)

## Notes

- The old credentials are now considered compromised since they were in git
- All users will be logged out when JWT secret changes (expected behavior)
- Database connection will fail until MongoDB password is updated
- This is a one-time process - future development won't have these issues
