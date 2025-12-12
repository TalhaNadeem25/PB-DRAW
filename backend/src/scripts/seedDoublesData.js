import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Pool from '../models/Pool.js';
import Match from '../models/Match.js';
import Event from '../models/Event.js';
import Tournament from '../models/Tournament.js';

dotenv.config();

const TOURNAMENT_ID = '6939a26a680dd80c3f87ed75';

// Helper function to generate round-robin matches
const generateRoundRobinMatches = (teams, poolId, eventId) => {
  const matches = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        pool: poolId,
        event: eventId,
        team1: teams[i],
        team2: teams[j],
        status: 'scheduled'
      });
    }
  }

  return matches;
};

const seedDoublesData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    // Check if tournament exists
    const tournament = await Tournament.findById(TOURNAMENT_ID);
    if (!tournament) {
      console.error('Tournament not found!');
      process.exit(1);
    }

    console.log(`Tournament: ${tournament.name}`);

    // Find or create a doubles event
    let doublesEvent = await Event.findOne({ tournament: TOURNAMENT_ID, format: 'doubles' });

    if (!doublesEvent) {
      console.log('\nCreating Men\'s Doubles event...');
      doublesEvent = await Event.create({
        tournament: TOURNAMENT_ID,
        name: "Men's Doubles",
        format: 'doubles',
        skillLevel: 3.0,
        maxTeams: 16,
        entryFee: 50,
        currentTeams: 0
      });
      tournament.events.push(doublesEvent._id);
      await tournament.save();
      console.log('✓ Created Men\'s Doubles event');
    }

    console.log(`\nSeeding data for event: ${doublesEvent.name} (${doublesEvent.format})`);

    // Create test players
    const players = [];
    const playerNames = [
      'John Smith', 'Mike Davis', 'Tom Brown', 'Jake Wilson',
      'Ryan Lee', 'Kevin White', 'Brad Taylor', 'Eric Johnson',
      'Sean Martin', 'Tyler Garcia', 'Matt Rodriguez', 'Chris Anderson'
    ];

    console.log('\nCreating/finding test players...');
    for (let i = 0; i < playerNames.length; i++) {
      const name = playerNames[i];
      const email = `${name.toLowerCase().replace(' ', '.')}@test.com`;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name,
          email,
          password: 'password123',
          role: 'player',
          skillLevel: 3.0 + Math.floor(Math.random() * 3) * 0.5,
          phone: `555-${String(2000 + i).padStart(4, '0')}`
        });
        console.log(`✓ Created player: ${name}`);
      } else {
        console.log(`- Player already exists: ${name}`);
      }

      players.push(user);
    }

    // Create doubles teams (2 players per team)
    console.log('\nCreating doubles teams...');
    const teams = [];
    const teamNames = ['Aces', 'Smashers', 'Slammers', 'Rockets', 'Titans', 'Warriors'];

    // Delete existing teams for this event
    await Team.deleteMany({ event: doublesEvent._id });

    for (let i = 0; i < 6; i++) {
      const team = await Team.create({
        name: teamNames[i],
        event: doublesEvent._id,
        players: [players[i * 2]._id, players[i * 2 + 1]._id],
        skillRating: 3.0 + Math.random() * 1.5
      });
      teams.push(team);
      console.log(`✓ Created team: ${teamNames[i]} (${players[i * 2].name} & ${players[i * 2 + 1].name})`);
    }

    // Update event team count
    doublesEvent.currentTeams = teams.length;
    await doublesEvent.save();

    // Delete existing pools and matches for this event
    console.log('\nCleaning up existing pools and matches...');
    const existingPools = await Pool.find({ event: doublesEvent._id });
    for (const pool of existingPools) {
      await Match.deleteMany({ pool: pool._id });
    }
    await Pool.deleteMany({ event: doublesEvent._id });

    // Create 2 pools
    console.log('\nCreating pools...');
    const poolA = await Pool.create({
      name: 'Pool A',
      event: doublesEvent._id,
      teams: [teams[0]._id, teams[1]._id, teams[2]._id]
    });
    console.log(`✓ Created Pool A with 3 teams`);

    const poolB = await Pool.create({
      name: 'Pool B',
      event: doublesEvent._id,
      teams: [teams[3]._id, teams[4]._id, teams[5]._id]
    });
    console.log(`✓ Created Pool B with 3 teams`);

    // Assign pools to teams
    console.log('\nAssigning teams to pools...');
    await Team.updateMany(
      { _id: { $in: [teams[0]._id, teams[1]._id, teams[2]._id] } },
      { pool: poolA._id }
    );
    await Team.updateMany(
      { _id: { $in: [teams[3]._id, teams[4]._id, teams[5]._id] } },
      { pool: poolB._id }
    );
    console.log('✓ Teams assigned to pools');

    // Generate matches for Pool A
    console.log('\nGenerating matches for Pool A...');
    const matchesA = generateRoundRobinMatches(
      [teams[0]._id, teams[1]._id, teams[2]._id],
      poolA._id,
      doublesEvent._id
    );
    const createdMatchesA = await Match.insertMany(matchesA);
    poolA.matches = createdMatchesA.map(m => m._id);
    await poolA.save();
    console.log(`✓ Created ${createdMatchesA.length} matches for Pool A`);

    // Add some scores to Pool A matches
    console.log('\nAdding sample scores to Pool A...');
    if (createdMatchesA[0]) {
      createdMatchesA[0].score = { team1Score: 11, team2Score: 8 };
      createdMatchesA[0].status = 'completed';
      await createdMatchesA[0].save();

      await Team.findByIdAndUpdate(teams[0]._id, {
        $inc: { 'stats.wins': 1, 'stats.pointsFor': 11, 'stats.pointsAgainst': 8, 'stats.pointDifferential': 3 }
      });
      await Team.findByIdAndUpdate(teams[1]._id, {
        $inc: { 'stats.losses': 1, 'stats.pointsFor': 8, 'stats.pointsAgainst': 11, 'stats.pointDifferential': -3 }
      });
      console.log(`✓ ${teams[0].name} defeated ${teams[1].name} 11-8`);
    }

    // Generate matches for Pool B
    console.log('\nGenerating matches for Pool B...');
    const matchesB = generateRoundRobinMatches(
      [teams[3]._id, teams[4]._id, teams[5]._id],
      poolB._id,
      doublesEvent._id
    );
    const createdMatchesB = await Match.insertMany(matchesB);
    poolB.matches = createdMatchesB.map(m => m._id);
    await poolB.save();
    console.log(`✓ Created ${createdMatchesB.length} matches for Pool B`);

    console.log('\n✅ Doubles seed data created successfully!');
    console.log('\nSummary:');
    console.log(`- Event: ${doublesEvent.name} (${doublesEvent.format})`);
    console.log(`- Created ${players.length} players`);
    console.log(`- Created ${teams.length} doubles teams (2 players each)`);
    console.log(`- Created 2 pools (Pool A and Pool B)`);
    console.log(`- Generated ${createdMatchesA.length + createdMatchesB.length} matches`);
    console.log(`- Added 1 completed match with score to Pool A`);
    console.log(`\nYou can now visit: http://localhost:8081/tournaments/${TOURNAMENT_ID}/events/${doublesEvent._id}/pools`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDoublesData();
