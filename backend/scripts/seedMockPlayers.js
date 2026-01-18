import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema (simplified for seeding)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'player' },
  skillLevel: { type: Number, default: 3.0 },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true },
  statistics: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    tournamentsPlayed: { type: Number, default: 0 },
    goldMedals: { type: Number, default: 0 },
    silverMedals: { type: Number, default: 0 },
    bronzeMedals: { type: Number, default: 0 }
  },
  tournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' }],
  createdTournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Event Schema (simplified)
const eventSchema = new mongoose.Schema({
  name: String,
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  format: String,
  playFormat: String,
  skillLevel: String,
  maxTeams: Number,
  currentTeams: { type: Number, default: 0 },
  entryFee: Number,
  status: String,
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  pools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pool' }],
  registeredPlayers: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registeredAt: { type: Date, default: Date.now },
    paymentStatus: { type: String, default: 'paid' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    pool: { type: mongoose.Schema.Types.ObjectId, ref: 'Pool' }
  }],
  schedule: Array
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

// Tournament Schema (simplified)
const tournamentSchema = new mongoose.Schema({
  name: String,
  registeredPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  currentPlayers: { type: Number, default: 0 }
}, { timestamps: true });

const Tournament = mongoose.model('Tournament', tournamentSchema);

const EVENT_ID = '696ac3ca584b8dce43a1aa16';
const TOURNAMENT_ID = '696ac3ca584b8dce43a1aa11';
const NUM_PLAYERS = 32;

const mockNames = [
  'Alex Johnson', 'Sam Williams', 'Jordan Brown', 'Taylor Davis',
  'Morgan Wilson', 'Casey Miller', 'Riley Anderson', 'Drew Thomas',
  'Jamie Jackson', 'Avery White', 'Quinn Harris', 'Blake Martin',
  'Cameron Garcia', 'Skyler Martinez', 'Parker Robinson', 'Reese Clark',
  'Dakota Lewis', 'Hayden Walker', 'Phoenix Hall', 'Sage Allen',
  'River Young', 'Rowan King', 'Finley Wright', 'Emerson Scott',
  'Charlie Green', 'Ash Baker', 'Eden Adams', 'Rory Nelson',
  'Tatum Hill', 'Lennon Moore', 'Shiloh Taylor', 'Marlowe Lee'
];

async function seedMockPlayers() {
  await connectDB();

  console.log(`Creating ${NUM_PLAYERS} mock players...`);

  const createdUsers = [];

  for (let i = 0; i < NUM_PLAYERS; i++) {
    const name = mockNames[i] || `Player ${i + 1}`;
    const email = `player${i + 1}@mocktest.com`;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', // bcrypt hash placeholder
        role: 'player',
        skillLevel: 3.0 + (Math.random() * 1.5), // Random skill between 3.0 and 4.5
        isActive: true,
        isEmailVerified: true
      });
      console.log(`Created user: ${name} (${email})`);
    } else {
      console.log(`User already exists: ${name} (${email})`);
    }

    createdUsers.push(user);
  }

  // Get the event
  const event = await Event.findById(EVENT_ID);
  if (!event) {
    console.error('Event not found!');
    process.exit(1);
  }

  console.log(`\nRegistering players to event: ${event.name}`);

  // Clear existing registrations for clean test
  event.registeredPlayers = [];

  // Register all users to the event
  for (const user of createdUsers) {
    event.registeredPlayers.push({
      player: user._id,
      registeredAt: new Date(),
      paymentStatus: 'paid',
      pool: null
    });
  }

  event.currentTeams = event.registeredPlayers.length;
  await event.save();

  console.log(`\nRegistered ${event.registeredPlayers.length} players to event`);

  // Update tournament registered players
  const tournament = await Tournament.findById(TOURNAMENT_ID);
  if (tournament) {
    tournament.registeredPlayers = createdUsers.map(u => u._id);
    tournament.currentPlayers = createdUsers.length;
    await tournament.save();
    console.log(`Updated tournament with ${tournament.currentPlayers} players`);
  }

  console.log('\n✅ Mock players seeded successfully!');
  console.log(`Event: ${event.name}`);
  console.log(`Players: ${event.registeredPlayers.length}`);
  console.log(`Play Format: ${event.playFormat}`);

  process.exit(0);
}

seedMockPlayers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
