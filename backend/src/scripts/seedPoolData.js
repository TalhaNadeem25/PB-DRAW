import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Pool from '../models/Pool.js';
import Match from '../models/Match.js';
import Event from '../models/Event.js';

dotenv.config();

const TOURNAMENT_ID = '693b5936dc5f0adfec5abdab';
const EVENT_ID = '693b5936dc5f0adfec5abdb5';

// Helper function to generate round-robin matches
// const generateRoundRobinMatches = (teams, poolId, eventId) => {
//   const matches = [];

//   for (let i = 0; i < teams.length; i++) {
//     for (let j = i + 1; j < teams.length; j++) {
//       matches.push({
//         pool: poolId,
//         event: eventId,
//         team1: teams[i],
//         team2: teams[j],
//         status: 'scheduled'
//       });
//     }
//   }

//   return matches;
// };

const seedPoolData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    // Check if event exists
    const event = await Event.findById(EVENT_ID);
    if (!event) {
      console.error('Event not found!');
      process.exit(1);
    }

    console.log(`Seeding data for event: ${event.name} (${event.format})`);

    // Determine if singles or doubles
    const isSingles = event.format === 'singles';
    const playersPerTeam = isSingles ? 1 : 2;

    // Create test players (16 players for 16 teams)
    const players = [];
    const playerNames = [
      'Alex Rodriguez', 'Maria Garcia', 'James Wilson', 'Sarah Chen',
      'Michael Brown', 'Emily Davis', 'David Martinez', 'Jessica Lee',
      'Robert Taylor', 'Amanda Johnson', 'Chris Anderson', 'Lisa White',
      'John Smith', 'Emma Thompson', 'Daniel Kim', 'Olivia Martinez'
    ];

    console.log('\nCreating test players...');
    for (let i = 0; i < playerNames.length; i++) {
      const name = playerNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@test.com`;

      // Check if user already exists
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name,
          email,
          password: 'password123',
          role: 'player',
          skillLevel: 3.0 + Math.floor(Math.random() * 3) * 0.5, // Random skill 3.0-4.5
          phone: `555-${String(1000 + i).padStart(4, '0')}`
        });
        console.log(`✓ Created player: ${name}`);
      } else {
        console.log(`- Player already exists: ${name}`);
      }

      players.push(user);
    }

    // Create teams
    console.log(`\nCreating teams (${playersPerTeam} player${playersPerTeam > 1 ? 's' : ''} per team)...`);
    const teams = [];
    const teamNames = [
      'Thunder', 'Lightning', 'Storm', 'Blaze', 'Frost', 'Phoenix',
      'Avalanche', 'Hurricane', 'Tornado', 'Cyclone', 'Volcano', 'Tsunami',
      'Eclipse', 'Nova', 'Comet', 'Meteor'
    ];

    // Delete existing teams for this event to avoid duplicates
    await Team.deleteMany({ event: EVENT_ID });

    const numTeams = 16; // Create 16 teams
    for (let i = 0; i < numTeams; i++) {
      const teamPlayers = [];
      for (let j = 0; j < playersPerTeam; j++) {
        const playerIndex = i * playersPerTeam + j;
        if (playerIndex < players.length) {
          teamPlayers.push(players[playerIndex]._id);
        }
      }

      if (teamPlayers.length === playersPerTeam) {
        const teamName = isSingles ? players[i].name : teamNames[i];
        const team = await Team.create({
          name: teamName,
          event: EVENT_ID,
          players: teamPlayers,
          skillRating: 3.0 + Math.random() * 1.5
        });
        teams.push(team);

        if (isSingles) {
          console.log(`✓ Created team: ${teamName}`);
        } else {
          console.log(`✓ Created team: ${teamName} (${players[i * 2].name} & ${players[i * 2 + 1].name})`);
        }
      }
    }

    // Update event team count and add teams to event
    event.teams = teams.map(t => t._id);
    event.currentTeams = teams.length;
    await event.save();
    console.log(`✓ Updated event with ${teams.length} teams`);

    // Delete existing pools and matches for this event
    console.log('\nCleaning up existing pools and matches...');
    const existingPools = await Pool.find({ event: EVENT_ID });
    for (const pool of existingPools) {
      await Match.deleteMany({ pool: pool._id });
    }
    await Pool.deleteMany({ event: EVENT_ID });

    console.log('\n✅ Seed data created successfully!');
    console.log('\nSummary:');
    console.log(`- Created ${players.length} players`);
    console.log(`- Created ${teams.length} teams`);
    console.log(`- Teams are ready to be assigned to pools`);
    console.log(`\nYou can now visit: http://localhost:8081/tournaments/${TOURNAMENT_ID}/events/${EVENT_ID}/pools`);
    console.log(`\nNote: Teams are not assigned to pools yet. Use the pool management interface to create pools and assign teams.`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedPoolData();
