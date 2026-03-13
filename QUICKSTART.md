# 🚀 Picklix - Quick Start Guide

## What's Been Built

Your Picklix app now has:
- ✅ **Frontend**: Complete React + TypeScript UI
- ✅ **Backend**: Complete Node.js + Express + MongoDB API

## Get Started in 3 Steps

### Step 1: Set Up MongoDB

#### Option A: Local MongoDB (Recommended for Development)
1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB:
   ```bash
   mongod
   ```

#### Option B: MongoDB Atlas (Cloud - Free Tier)
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `backend/.env` with your connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pickle-rally?retryWrites=true&w=majority
   ```

---

### Step 2: Start the Backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running in development mode on port 5000
📡 API available at http://localhost:5000/api
🎾 Picklix Backend is ready!
```

Test it: Open http://localhost:5000/api in your browser

---

### Step 3: Start the Frontend

Open a new terminal:

```bash
cd ..  # Go back to project root
npm install
npm run dev
```

Frontend will run at: http://localhost:8080

---

## Test the API

### Using cURL:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\",\"role\":\"organizer\"}"

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

### Using Postman/Insomnia:
1. Import the endpoints from `backend/README.md`
2. Start with `/api/auth/register` to create a user
3. Then `/api/auth/login` to get a JWT token
4. Use the token in Authorization header for protected routes

---

## Project Structure

```
pickle-rally/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth & error handling
│   │   ├── config/      # Database config
│   │   └── server.js    # Entry point
│   ├── .env             # Environment variables
│   └── package.json
│
├── src/                 # React frontend
│   ├── pages/          # Page components
│   ├── components/     # UI components
│   ├── types/          # TypeScript types
│   └── ...
│
└── PROJECT_STATUS.md   # Detailed project status
```

---

## API Endpoints Summary

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user (protected)

### Tournaments
- GET `/api/tournaments` - Get all tournaments
- POST `/api/tournaments` - Create tournament (organizer only)
- GET `/api/tournaments/:id` - Get tournament details
- PUT `/api/tournaments/:id` - Update tournament
- DELETE `/api/tournaments/:id` - Delete tournament
- POST `/api/tournaments/:id/register` - Register for tournament

### Events, Teams, Pools, Matches
See `backend/README.md` for complete API documentation (25+ endpoints)

---

## Next Steps

### Immediate:
1. ✅ Start MongoDB
2. ✅ Start backend server
3. ✅ Test API endpoints
4. ✅ Start frontend

### Soon:
1. Connect frontend to backend API
2. Create login/signup pages
3. Replace mock data with real API calls
4. Add authentication context to frontend

### Later:
1. Payment integration
2. Tournament brackets
3. Email notifications
4. Deploy to production

---

## Troubleshooting

### Backend won't start?
- Check if MongoDB is running
- Verify `.env` file exists in `backend/` folder
- Check if port 5000 is available

### Can't connect to MongoDB?
- Local: Make sure `mongod` is running
- Atlas: Verify connection string in `.env`
- Check firewall/network settings

### Frontend can't reach backend?
- Backend should run on port 5000
- Frontend runs on port 8080
- CORS is configured for localhost:8080

---

## Resources

- **API Documentation**: `backend/README.md`
- **Project Status**: `PROJECT_STATUS.md`
- **MongoDB Docs**: https://docs.mongodb.com
- **Express Docs**: https://expressjs.com
- **React Docs**: https://react.dev

---

**Questions?** Check the documentation or review the code comments!
