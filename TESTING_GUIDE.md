# 🧪 Testing Guide - Picklix Integration

## What's Been Connected

✅ **Authentication System**
- Login page functional
- Signup page functional
- JWT tokens stored and managed
- User state persisted across page reloads
- Navbar shows user info and logout option

✅ **Tournaments Page**
- Fetches real data from API
- Search and filters work with API
- Loading and error states
- No more mock data!

## How to Test

### Step 1: Start the Backend

```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ MongoDB Connected: cluster0.ypjgvcy.mongodb.net
🚀 Server running in development mode on port 5000
📡 API available at http://localhost:5000/api
🎾 Picklix Backend is ready!
```

### Step 2: Start the Frontend

Open a new terminal:

```bash
cd ..  # Go back to project root
npm run dev
```

**Frontend runs at:** http://localhost:8080

---

## Test Cases

### 🔐 Test 1: User Registration

1. Go to http://localhost:8080
2. Click "Sign Up" in the navbar
3. Fill out the registration form:
   - **Name:** John Doe
   - **Email:** john@example.com
   - **Password:** password123
   - **Confirm Password:** password123
   - **Role:** Organizer (if you want to create tournaments)
   - **Skill Level:** 4.0
   - **Phone:** (optional)
4. Click "Create Account"

**Expected result:**
- ✅ Toast notification: "Registration successful!"
- ✅ Redirected to /tournaments page
- ✅ Navbar shows your name with a dropdown
- ✅ Token saved in localStorage

### 🔐 Test 2: User Login

1. Click "Log Out" from the navbar dropdown
2. Click "Log In" in the navbar
3. Enter credentials:
   - **Email:** john@example.com
   - **Password:** password123
4. Click "Sign In"

**Expected result:**
- ✅ Toast notification: "Login successful!"
- ✅ Redirected to /tournaments page
- ✅ Navbar shows user info again

### 🏆 Test 3: View Tournaments

1. While logged in, go to "Find Tournaments"
2. Currently, the database is empty, so you'll see "No tournaments found"

**Expected result:**
- ✅ Page loads without errors
- ✅ Shows "0 tournaments" (empty database)
- ✅ No mock data displayed

### 🏆 Test 4: Create a Tournament (Next Step)

This will work once we connect the CreateTournament page (next step):
1. Click dropdown in navbar → "Create Tournament"
2. Fill out the form
3. Submit

---

## Debugging Tips

### Problem: "Network Error" when signing up/logging in

**Solution:**
1. Check backend is running on port 5000
2. Check `backend/.env` has correct MongoDB URI
3. Open http://localhost:5000/api - should show API info

### Problem: "CORS Error"

**Solution:**
Backend CORS is already configured for `http://localhost:8080`.
If using different port, update `backend/.env`:
```
CLIENT_URL=http://localhost:YOUR_PORT
```

### Problem: Tournaments page shows loading spinner forever

**Solution:**
1. Check backend is running
2. Check browser console for errors
3. MongoDB connection should be successful
4. Try creating a tournament via API first (Postman)

### Problem: Token expires or logout doesn't work

**Solution:**
1. Clear localStorage: Open DevTools → Application → Local Storage → Clear
2. JWT tokens expire in 7 days (configurable in `backend/.env`)

---

## Browser DevTools Checklist

### Check LocalStorage:
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Should see:
   - `token`: Your JWT token
   - `user`: Your user data JSON

### Check Network Tab:
1. Open DevTools → Network
2. Sign up or log in
3. Look for API calls:
   - POST to `http://localhost:5000/api/auth/register`
   - POST to `http://localhost:5000/api/auth/login`
   - GET to `http://localhost:5000/api/tournaments`

### Check Console:
- Should be error-free
- Any red errors indicate problems

---

## Test Data You Can Create

### Via Backend API (Postman/cURL):

**Create a test tournament:**
```bash
# First, register and get token
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Jane Organizer",
    "email":"jane@example.com",
    "password":"password123",
    "role":"organizer"
  }'

# Copy the token from response, then create tournament
curl -X POST http://localhost:5000/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name":"Summer Slam 2025",
    "description":"Annual summer tournament",
    "location":"Austin, TX",
    "address":"123 Court St, Austin, TX 78701",
    "startDate":"2025-07-15",
    "endDate":"2025-07-17",
    "registrationDeadline":"2025-07-10",
    "maxPlayers":128,
    "status":"open"
  }'
```

Now refresh the Tournaments page - you should see your tournament!

---

## What Works Now ✅

- ✅ User registration
- ✅ User login/logout
- ✅ Authentication state management
- ✅ Protected API calls with JWT
- ✅ Tournaments page fetches from API
- ✅ User info in navbar
- ✅ Token persistence across page reloads

## What's Next 🚧

The following pages still need API integration:
- CreateTournament page (submit to API)
- TournamentDetail page (fetch from API)
- PoolManagement page (fetch/update via API)
- Protected routes (prevent access without login)

---

## Quick Reference

### Backend API URL
```
http://localhost:5000/api
```

### Frontend URL
```
http://localhost:8080
```

### Test User Credentials
After you create them:
- **Email:** john@example.com
- **Password:** password123

---

**Questions?** Check browser console for errors or backend terminal for API logs!


cd "C:\Users\nadee\OneDrive\Desktop\UTA\Fall 2025\KPAK\pickle-rally\backend" && node -e "
   import('mongoose').then(async (mongoose) => {
     await mongoose.default.connect('mongodb+srv://personalwork425_db_user:sntKHOaenR3bJeEj@cluster0.ypjgvcy.mongodb.
   net/?appName=Cluster0');
     const Event = mongoose.default.model('Event', new mongoose.default.Schema({}, { strict: false }));
     const event = await Event.findById('693b5936dc5f0adfec5abdb0');
     console.log('Event:', event.name);
     console.log('Format:', event.format);
     console.log('Play Format:', event.playFormat || 'not set');
     process.exit(0);
   });
   "