import cron from 'node-cron';
import Waitlist from '../models/Waitlist.js';
import { expirePromotion } from '../controllers/waitlistController.js';

/**
 * Waitlist Expiration Cron Job
 * Runs every hour to check for expired waitlist promotions
 * and automatically promote the next person in line
 */
export const startWaitlistExpirationJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔄 Running waitlist expiration check...');

      // Find all promoted waitlist entries that have expired
      const expiredEntries = await Waitlist.find({
        status: 'promoted',
        promotionExpiresAt: { $lt: new Date() }
      }).populate('event', 'name');

      if (expiredEntries.length === 0) {
        console.log('✅ No expired waitlist promotions found');
        return;
      }

      console.log(`⏰ Found ${expiredEntries.length} expired waitlist promotion(s)`);

      // Process each expired entry
      let successCount = 0;
      let errorCount = 0;

      for (const entry of expiredEntries) {
        try {
          await expirePromotion(entry._id);
          successCount++;
          console.log(`  ✅ Expired waitlist entry ${entry._id} for event ${entry.event?.name || entry.event}`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Failed to expire waitlist entry ${entry._id}:`, error.message);
        }
      }

      console.log(`\n📊 Waitlist expiration summary:`);
      console.log(`   - Processed: ${expiredEntries.length}`);
      console.log(`   - Succeeded: ${successCount}`);
      console.log(`   - Failed: ${errorCount}\n`);

    } catch (error) {
      console.error('❌ Error in waitlist expiration job:', error);
    }
  });

  console.log('⏰ Waitlist expiration cron job started (runs hourly)');
};

/**
 * Manual trigger for testing (can be called from API endpoint)
 */
export const triggerWaitlistExpirationCheck = async () => {
  try {
    console.log('🔄 Manually triggering waitlist expiration check...');

    const expiredEntries = await Waitlist.find({
      status: 'promoted',
      promotionExpiresAt: { $lt: new Date() }
    });

    if (expiredEntries.length === 0) {
      return {
        success: true,
        message: 'No expired waitlist promotions found',
        processed: 0
      };
    }

    const results = [];
    for (const entry of expiredEntries) {
      try {
        await expirePromotion(entry._id);
        results.push({ id: entry._id, success: true });
      } catch (error) {
        results.push({ id: entry._id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return {
      success: true,
      message: `Processed ${expiredEntries.length} expired promotion(s)`,
      processed: expiredEntries.length,
      succeeded: successCount,
      failed: errorCount,
      results
    };

  } catch (error) {
    console.error('❌ Error in manual waitlist expiration check:', error);
    throw error;
  }
};
