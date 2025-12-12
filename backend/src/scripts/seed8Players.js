import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';

dotenv.config();

const EVENT_ID = '693a24f5680dd80c3f87f28c';

const seed8Players = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...\n');

    const event = await Event.findById(EVENT_ID);
    if (!event) {
      console.error('Event not found!');
      process.exit(1);
    }

    console.log(`Event: ${event.name} (${event.format})`);

    // Create 8 players
    const playerNames = [
      'John Anderson',
      'Sarah Williams',
      'Michael Chen',
      'Emily Brown',
      'David Martinez',
      'Jessica Taylor',
      'Robert Johnson',
      'Amanda Davis'
    ];

    console.log('\nCreating 8 players...');
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
          phone: `555-${String(3000 + i).padStart(4, '0')}`
        });
        console.log(`✓ Created player: ${name}`);
      } else {
        console.log(`- Player already exists: ${name}`);
      }

      players.push(user);
    }

    // Delete existing teams for this event
    await Team.deleteMany({ event: EVENT_ID });

    // Create 8 teams (1 player each for singles)
    console.log('\nCreating 8 teams...');
    const teams = [];

    for (let i = 0; i < 8; i++) {
      const team = await Team.create({
        name: players[i].name,
        event: EVENT_ID,
        players: [players[i]._id],
        skillRating: 3.0 + Math.random() * 2
      });
      teams.push(team);
      console.log(`✓ Created team: ${players[i].name}`);
    }

    // Update event
    event.teams = teams.map(t => t._id);
    event.currentTeams = teams.length;
    if (!event.playFormat) {
      event.playFormat = 'round-robin';
    }
    await event.save();

    console.log('\n✅ Successfully created 8 players/teams!');
    console.log(`\nVisit: http://localhost:8081/tournaments/693a24f4680dd80c3f87f287/events/${EVENT_ID}/pools`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seed8Players();
