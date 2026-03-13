# Picklix Backend API

RESTful API for Picklix - A pickleball tournament management platform.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your MongoDB connection string and JWT secret.

4. Start MongoDB (if using local):
```bash
# Windows (if MongoDB is installed)
mongod

# Or use MongoDB Atlas cloud database
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "player",
  "skillLevel": 3.5,
  "phone": "555-0123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me
```
🔒 Requires authentication

### Update Profile
```http
PUT /api/auth/profile
```
🔒 Requires authentication

**Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "555-9999",
  "skillLevel": 4.0
}
```

---

## 🏆 Tournament Endpoints

### Get All Tournaments
```http
GET /api/tournaments
```

**Query Parameters:**
- `status` - Filter by status (all, open, closed, in-progress, completed)
- `search` - Search by name, location, or description
- `limit` - Results per page (default: 10)
- `page` - Page number (default: 1)

**Example:**
```
GET /api/tournaments?status=open&limit=20&page=1
```

### Get Single Tournament
```http
GET /api/tournaments/:id
```

### Create Tournament
```http
POST /api/tournaments
```
🔒 Requires authentication (organizer or admin)

**Body:**
```json
{
  "name": "Summer Slam 2025",
  "description": "Annual summer pickleball tournament",
  "location": "Austin, TX",
  "address": "123 Court St, Austin, TX 78701",
  "startDate": "2025-07-15",
  "endDate": "2025-07-17",
  "registrationDeadline": "2025-07-10",
  "maxPlayers": 64,
  "status": "open",
  "venue": {
    "name": "Austin Pickleball Center",
    "courts": 8,
    "facilities": ["Restrooms", "Parking", "Food"]
  }
}
```

### Update Tournament
```http
PUT /api/tournaments/:id
```
🔒 Requires authentication (tournament organizer or admin)

### Delete Tournament
```http
DELETE /api/tournaments/:id
```
🔒 Requires authentication (tournament organizer or admin)

### Register for Tournament
```http
POST /api/tournaments/:id/register
```
🔒 Requires authentication

---

## 🎯 Event Endpoints

### Get Events for Tournament
```http
GET /api/tournaments/:tournamentId/events
```

### Get Single Event
```http
GET /api/events/:id
```

### Create Event
```http
POST /api/tournaments/:tournamentId/events
```
🔒 Requires authentication (organizer or admin)

**Body:**
```json
{
  "name": "Men's Doubles 4.0",
  "format": "doubles",
  "skillLevel": "4.0",
  "maxTeams": 16,
  "entryFee": 50,
  "status": "registration-open"
}
```

### Update Event
```http
PUT /api/events/:id
```
🔒 Requires authentication (organizer or admin)

### Delete Event
```http
DELETE /api/events/:id
```
🔒 Requires authentication (organizer or admin)

---

## 👥 Team Endpoints

### Get Teams for Event
```http
GET /api/events/:eventId/teams
```

### Get Single Team
```http
GET /api/teams/:id
```

### Create Team
```http
POST /api/events/:eventId/teams
```
🔒 Requires authentication

**Body:**
```json
{
  "name": "Team Smash",
  "players": ["user_id_1", "user_id_2"],
  "skillRating": 4.0
}
```

### Update Team
```http
PUT /api/teams/:id
```
🔒 Requires authentication (team member, organizer, or admin)

### Delete Team
```http
DELETE /api/teams/:id
```
🔒 Requires authentication (team member, organizer, or admin)

---

## 🏊 Pool Endpoints

### Get Pools for Event
```http
GET /api/events/:eventId/pools
```

### Get Single Pool
```http
GET /api/pools/:id
```

### Create Pool
```http
POST /api/events/:eventId/pools
```
🔒 Requires authentication (organizer or admin)

**Body:**
```json
{
  "name": "Pool A",
  "teamIds": ["team_id_1", "team_id_2", "team_id_3", "team_id_4"]
}
```

### Add Teams to Pool
```http
POST /api/pools/:id/teams
```
🔒 Requires authentication (organizer or admin)

**Body:**
```json
{
  "teamIds": ["team_id_5", "team_id_6"]
}
```

### Update Pool
```http
PUT /api/pools/:id
```
🔒 Requires authentication (organizer or admin)

### Delete Pool
```http
DELETE /api/pools/:id
```
🔒 Requires authentication (organizer or admin)

---

## 🎾 Match Endpoints

### Get Matches for Pool
```http
GET /api/pools/:poolId/matches
```

### Get Single Match
```http
GET /api/matches/:id
```

### Update Match Score
```http
PUT /api/matches/:id/score
```
🔒 Requires authentication (organizer or admin)

**Body:**
```json
{
  "team1Score": 11,
  "team2Score": 8,
  "status": "completed"
}
```

### Update Match Details
```http
PUT /api/matches/:id
```
🔒 Requires authentication (organizer or admin)

**Body:**
```json
{
  "scheduledTime": "2025-07-15T10:00:00Z",
  "courtNumber": 3,
  "notes": "Championship match"
}
```

---

## 🔑 User Roles

- **player** - Can register for tournaments, create teams, view information
- **organizer** - Can create and manage tournaments, events, pools, and matches
- **admin** - Full access to all operations

---

## ⚠️ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 🧪 Testing the API

You can use tools like:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [Thunder Client](https://www.thunderclient.com/) (VS Code extension)
- cURL commands

### Example cURL Request:
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "organizer"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get tournaments (with auth token)
curl http://localhost:5000/api/tournaments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗄️ Database Models

### User
- name, email, password, role, skillLevel, phone, avatar
- tournaments (registered), createdTournaments

### Tournament
- name, description, location, address
- startDate, endDate, registrationDeadline
- maxPlayers, currentPlayers, status
- organizer, events, registeredPlayers

### Event
- name, tournament, format, skillLevel
- maxTeams, currentTeams, entryFee, status
- teams, pools, schedule

### Team
- name, event, players, pool, seed
- skillRating, stats (wins, losses, points)

### Pool
- name, event, teams, matches, status
- advancementRules

### Match
- pool, event, team1, team2
- score, winner, status
- scheduledTime, courtNumber, completedAt

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Helmet, CORS, bcrypt
- **Logging:** Morgan

---

## 📝 Notes

- All dates should be in ISO 8601 format
- Passwords are hashed using bcrypt
- JWT tokens expire in 7 days (configurable in .env)
- Round-robin matches are automatically generated when pools are created
- Team stats are automatically updated when match scores are entered
