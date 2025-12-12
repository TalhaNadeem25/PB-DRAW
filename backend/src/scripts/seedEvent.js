import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';

dotenv.config();

const TOURNAMENT_ID = process.argv[2] || '693a291e680dd80c3f87f542';
const EVENT_ID = process.argv[3] || '693a291f680dd80c3f87f547';

const seedEvent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...\n');

    const event = await Event.findById(EVENT_ID);
    if (!event) {
      console.error('Event not found!');
      process.exit(1);
    }

    console.log(`Event: ${event.name} (${event.format})`);

    // Set playFormat based on event name if not set
    if (!event.playFormat) {
      const nameLower = event.name.toLowerCase();
      if (nameLower.includes('single elim')) {
        event.playFormat = 'single-elimination';
      } else if (nameLower.includes('double elim')) {
        event.playFormat = 'double-elimination';
      } else if (nameLower.includes('round robin') || nameLower.includes('rr')) {
        event.playFormat = 'round-robin';
      } else if (nameLower.includes('swiss')) {
        event.playFormat = 'swiss';
      } else {
        event.playFormat = 'round-robin';
      }
      await event.save();
      console.log(`✓ Set playFormat to: ${event.playFormat}\n`);
    } else {
      console.log(`Play Format: ${event.playFormat}\n`);
    }

    const isSingles = event.format === 'singles';
    const playersPerTeam = isSingles ? 1 : 2;

    // Create 8 players
    const playerNames = [
      'Tyler Brooks', 'Megan Foster', 'Brandon Hayes', 'Nicole Murphy',
      'Kevin Russell', 'Ashley Coleman', 'Marcus Jenkins', 'Rachel Wright'
    ];

    console.log('Creating 8 players...');
    const players = [];

    for (let i = 0; i < playerNames.length; i++) {
      const name = playerNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@test.com`;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name,
          email,
          password: 'password123',
          role: 'player',
          skillLevel: 3.0 + (Math.random() * 2),
          phone: `555-${String(4000 + i).padStart(4, '0')}`
        });
        console.log(`✓ Created player: ${name}`);
      } else {
        console.log(`- Player already exists: ${name}`);
      }

      players.push(user);
    }

    // Delete existing teams for this event
    await Team.deleteMany({ event: EVENT_ID });

    // Create teams
    console.log(`\nCreating teams (${playersPerTeam} player${playersPerTeam > 1 ? 's' : ''} per team)...`);
    const teams = [];

    for (let i = 0; i < 8; i++) {
      const teamPlayers = [];
      for (let j = 0; j < playersPerTeam; j++) {
        const playerIndex = i * playersPerTeam + j;
        if (playerIndex < players.length) {
          teamPlayers.push(players[playerIndex]._id);
        }
      }

      if (teamPlayers.length === playersPerTeam) {
        const teamName = isSingles ? players[i].name : `Team ${i + 1}`;
        const team = await Team.create({
          name: teamName,
          event: EVENT_ID,
          players: teamPlayers,
          skillRating: 3.0 + Math.random() * 2
        });
        teams.push(team);
        console.log(`✓ Created team: ${teamName}`);
      }
    }

    // Update event
    event.teams = teams.map(t => t._id);
    event.currentTeams = teams.length;
    await event.save();

    console.log('\n✅ Successfully created 8 players/teams!');
    console.log(`\nVisit: http://localhost:8081/tournaments/${TOURNAMENT_ID}/events/${EVENT_ID}/pools`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedEvent();
