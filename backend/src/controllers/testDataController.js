import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Payment from '../models/Payment.js';
import Tournament from '../models/Tournament.js';

const TEST_EMAIL_DOMAIN = '@test.pickleplay.local';

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Cameron', 'Dakota', 'Skyler', 'Reese', 'Parker', 'Blake', 'Drew', 'Jamie',
  'Hayden', 'Peyton', 'Rowan', 'Sage', 'Finley', 'Emerson', 'Charlie', 'River',
  'Kai', 'Lennox', 'Phoenix', 'Dallas', 'Harley', 'Jesse', 'Lane', 'Remy',
  'Ellis', 'Nico', 'Tatum', 'Shea', 'Kendall', 'Logan', 'Mason', 'Spencer',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Chen', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Wilson', 'Moore', 'Jackson', 'Lee',
  'Patel', 'Kim', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Scott', 'Baker', 'Adams', 'Nelson', 'Hill',
];

/**
 * @desc    Generate test registrations for an event
 * @route   POST /api/tournaments/:tournamentId/test-data
 * @access  Private (Organizer/Admin)
 */
export const generateTestData = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { eventId, count } = req.body;

    if (!eventId || !count || count < 1 || count > 100) {
      return res.status(400).json({
        success: false,
        message: 'eventId and count (1-100) are required',
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Auth check
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const isSingles = event.format === 'singles';
    const timestamp = Date.now();
    let created = 0;

    if (isSingles) {
      // Singles: create individual users and register each
      for (let i = 0; i < count; i++) {
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const name = `${firstName} ${lastName}`;
        const email = `test-${timestamp}-${i}${TEST_EMAIL_DOMAIN}`;
        const skillLevel = +(2.5 + Math.random() * 2.5).toFixed(1); // 2.5-5.0

        const user = await User.create({
          name,
          email,
          password: 'TestPass123!',
          role: 'player',
          skillLevel,
          isActive: true,
          isEmailVerified: true,
        });

        const payment = await Payment.create({
          user: user._id,
          event: event._id,
          events: [event._id],
          tournament: tournament._id,
          amount: event.entryFee || 0,
          status: 'completed',
          eventBreakdown: [{
            eventId: event._id,
            isSingles: true,
            amount: event.entryFee || 0,
            eventName: event.name,
          }],
          metadata: { description: 'Test registration' },
        });

        event.registeredPlayers.push({
          player: user._id,
          registeredAt: new Date(),
          paymentStatus: 'paid',
          payment: payment._id,
        });

        created++;
      }

      event.currentTeams = event.registeredPlayers.filter(r => r.paymentStatus === 'paid').length;
      await event.save();
    } else {
      // Doubles/Mixed: create pairs of users → teams
      const pairsNeeded = count;

      for (let i = 0; i < pairsNeeded; i++) {
        const players = [];

        for (let p = 0; p < 2; p++) {
          const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
          const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
          const name = `${firstName} ${lastName}`;
          const email = `test-${timestamp}-${i}-p${p}${TEST_EMAIL_DOMAIN}`;
          const skillLevel = +(2.5 + Math.random() * 2.5).toFixed(1);

          const user = await User.create({
            name,
            email,
            password: 'TestPass123!',
            role: 'player',
            skillLevel,
            isActive: true,
            isEmailVerified: true,
          });

          players.push(user);
        }

        const teamName = `${players[0].name.split(' ')[0]} / ${players[1].name.split(' ')[0]}`;
        const avgSkill = (players[0].skillLevel + players[1].skillLevel) / 2;

        const team = await Team.create({
          name: teamName,
          event: event._id,
          players: players.map(p => p._id),
          skillRating: avgSkill,
          paymentStatus: 'paid',
          paymentAmount: event.entryFee || 0,
          paidAmount: event.entryFee || 0,
          registrationConfirmed: true,
        });

        const payment = await Payment.create({
          user: players[0]._id,
          team: team._id,
          event: event._id,
          events: [event._id],
          teams: [team._id],
          tournament: tournament._id,
          amount: event.entryFee || 0,
          status: 'completed',
          eventBreakdown: [{
            eventId: event._id,
            teamId: team._id,
            isSingles: false,
            amount: event.entryFee || 0,
            eventName: event.name,
          }],
          metadata: { description: 'Test registration' },
        });

        team.payments.push(payment._id);
        await team.save();

        event.teams.push(team._id);
        created++;
      }

      event.currentTeams = (event.currentTeams || 0) + pairsNeeded;
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: `Created ${created} test ${isSingles ? 'player' : 'team'} registration(s)`,
      data: { created, format: event.format },
    });
  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate test data',
      errors: error.errors ? Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`) : undefined,
    });
  }
};

/**
 * @desc    Clear all test registrations for a tournament
 * @route   DELETE /api/tournaments/:tournamentId/test-data
 * @access  Private (Organizer/Admin)
 */
export const clearTestData = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find all test users
    const testUsers = await User.find({
      email: { $regex: TEST_EMAIL_DOMAIN.replace('.', '\\.') + '$' },
    });

    const testUserIds = testUsers.map(u => u._id);

    if (testUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No test data found',
        data: { usersRemoved: 0, teamsRemoved: 0, paymentsRemoved: 0 },
      });
    }

    // Find events for this tournament
    const events = await Event.find({ tournament: tournamentId });

    let teamsRemoved = 0;

    for (const event of events) {
      // Remove test players from singles registeredPlayers
      const beforeCount = event.registeredPlayers.length;
      event.registeredPlayers = event.registeredPlayers.filter(
        reg => !testUserIds.some(id => id.equals(reg.player))
      );
      const singlesRemoved = beforeCount - event.registeredPlayers.length;

      // Remove test teams from doubles
      const testTeams = await Team.find({
        event: event._id,
        players: { $in: testUserIds },
      });

      const testTeamIds = testTeams.map(t => t._id);
      if (testTeamIds.length > 0) {
        event.teams = event.teams.filter(
          teamId => !testTeamIds.some(id => id.equals(teamId))
        );
        teamsRemoved += testTeamIds.length;
      }

      // Recalculate currentTeams
      if (event.format === 'singles') {
        event.currentTeams = event.registeredPlayers.filter(r => r.paymentStatus === 'paid').length;
      } else {
        event.currentTeams = Math.max(0, (event.currentTeams || 0) - testTeamIds.length);
      }

      await event.save();
    }

    // Delete teams, payments, and users
    const deletedTeams = await Team.deleteMany({ players: { $in: testUserIds } });
    const deletedPayments = await Payment.deleteMany({ user: { $in: testUserIds } });
    const deletedUsers = await User.deleteMany({ _id: { $in: testUserIds } });

    res.status(200).json({
      success: true,
      message: `Cleared test data: ${deletedUsers.deletedCount} users, ${teamsRemoved} teams removed from events`,
      data: {
        usersRemoved: deletedUsers.deletedCount,
        teamsRemoved: deletedTeams.deletedCount,
        paymentsRemoved: deletedPayments.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error clearing test data:', error);
    next(error);
  }
};

export default { generateTestData, clearTestData };
