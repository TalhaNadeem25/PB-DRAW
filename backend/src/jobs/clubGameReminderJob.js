import cron from 'node-cron';
import ClubGame from '../models/ClubGame.js';
import { createBatchNotifications } from '../controllers/notificationController.js';

// Send a reminder this many hours before a game starts
const REMINDER_WINDOW_HOURS = 3;

/**
 * Club Game Reminder Cron Job
 * Runs every 15 minutes to notify RSVP'd members ("going" or "maybe")
 * about club games starting within the reminder window.
 */
export const startClubGameReminderJob = (io) => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('🔄 Running club game reminder check...');
      await runClubGameReminderCheck(io);
    } catch (error) {
      console.error('❌ Error in club game reminder job:', error);
    }
  });

  console.log('⏰ Club game reminder cron job started (runs every 15 min)');
};

/**
 * Core check, also callable directly (manual trigger / testing).
 */
export const runClubGameReminderCheck = async (io = null) => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const games = await ClubGame.find({
    status: 'scheduled',
    reminderSent: false,
    date: { $gte: now, $lte: windowEnd }
  }).populate('club', 'name');

  if (games.length === 0) {
    console.log('✅ No upcoming games need reminders');
    return { processed: 0, sent: 0 };
  }

  console.log(`⏰ Found ${games.length} game(s) needing reminders`);

  let sent = 0;
  for (const game of games) {
    try {
      const recipientIds = game.rsvps
        .filter((r) => r.status === 'going' || r.status === 'maybe')
        .map((r) => r.user);

      if (recipientIds.length > 0) {
        const clubId = game.club?._id ?? game.club;
        const clubName = game.club?.name ?? 'your club';
        const timeStr = game.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        await createBatchNotifications(io, recipientIds, {
          type: 'club-game-reminder',
          title: `Game starting soon — ${clubName}`,
          message: `Your ${clubName} game starts at ${timeStr}${game.location ? ` at ${game.location}` : ''}.`,
          data: { actionUrl: `/clubs/${clubId}?tab=games` }
        });
      }

      game.reminderSent = true;
      await game.save();
      sent++;
      console.log(`  ✅ Reminder sent for game ${game._id} (${recipientIds.length} recipient(s))`);
    } catch (error) {
      console.error(`  ❌ Failed to send reminder for game ${game._id}:`, error.message);
    }
  }

  console.log(`📊 Club game reminder summary: ${sent}/${games.length} sent`);
  return { processed: games.length, sent };
};
