# Pickle Rally

A full-stack tournament management platform for pickleball. Organizers can create tournaments, manage events, schedule matches across courts, handle payments, and run live scoring — all from one dashboard. Players can discover tournaments, register, find partners, and follow live results.

**Live**: [pickletournaments.vercel.app](https://pickletournaments.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js, MongoDB/Mongoose, Socket.IO |
| Payments | Stripe (Connect for organizer payouts) |
| Deployment | Vercel (frontend + serverless API) |
| File Uploads | Cloudinary |

## Features

### For Organizers
- Create and manage tournaments with multiple events (singles, doubles, mixed)
- Drag-and-drop and click-to-assign match scheduler with auto-schedule
- Court management with real-time match tracking
- Pool play and playoff bracket generation
- Player check-in via QR code scanning
- Stripe Connect integration for collecting entry fees
- AI-powered tournament planner
- Analytics dashboard with registration and revenue insights
- Email communications to registered players
- Test data generator for development/demo purposes

### For Players
- Browse and discover upcoming tournaments
- Register and pay for events online
- Find and invite doubles partners
- View live scores and match updates via Socket.IO
- Digital tickets with QR codes
- Waitlist support for full events

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account (for payments)

### Installation

```bash
# Clone the repo
git clone https://github.com/TalhaNadeem25/pickle-rally.git
cd pickle-rally

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### Environment Variables

Copy the example files and fill in your values:

```bash
# Frontend
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
```

See `.env.example` and `backend/.env.example` for all available configuration options.

### Running Locally

```bash
# Start the backend (from project root)
cd backend && npm run dev

# Start the frontend (from project root, in a separate terminal)
npm run dev
```

The frontend runs on `http://localhost:8080` and the backend API on `http://localhost:5000`.

## Project Structure

```
pickle-rally/
├── src/                    # React frontend
│   ├── components/         # UI components (layout, tournament, dashboard)
│   ├── pages/              # Route pages
│   ├── services/           # API client and utilities
│   ├── contexts/           # React context providers (Auth, Socket)
│   └── hooks/              # Custom React hooks
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express route definitions
│   │   ├── middleware/     # Auth, rate limiting, error handling
│   │   └── config/         # Database and service configs
│   └── server.js           # Local dev entry point
├── api/
│   └── index.js            # Vercel serverless entry point
└── vercel.json             # Vercel deployment config
```

## Deployment

The app deploys to Vercel. Push to `main` to trigger automatic deployment.

**Important**: The backend has two entry points — `backend/src/server.js` for local development and `api/index.js` for Vercel serverless. When adding new API routes, update both files.

## License

MIT
