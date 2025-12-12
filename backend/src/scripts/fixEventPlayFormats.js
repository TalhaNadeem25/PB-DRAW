import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';

dotenv.config();

const fixEventPlayFormats = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...\n');

    // Get all events
    const events = await Event.find({});

    console.log(`Found ${events.length} events\n`);

    for (const event of events) {
      let playFormat = 'round-robin'; // default

      // Try to infer from event name
      const nameLower = event.name.toLowerCase();
      if (nameLower.includes('single elim') || nameLower.includes('se ')) {
        playFormat = 'single-elimination';
      } else if (nameLower.includes('double elim') || nameLower.includes('de ')) {
        playFormat = 'double-elimination';
      } else if (nameLower.includes('pool')) {
        playFormat = 'pool-play';
      } else if (nameLower.includes('swiss')) {
        playFormat = 'swiss';
      }

      // Update the event
      const oldFormat = event.playFormat;
      event.playFormat = playFormat;
      await event.save();

      console.log(`✓ ${event.name}`);
      console.log(`  Format: ${event.format} (${oldFormat || 'not set'} → ${playFormat})`);
      console.log('');
    }

    console.log('✅ All events updated!');
    console.log('\nSummary:');
    const summary = await Event.aggregate([
      { $group: { _id: '$playFormat', count: { $sum: 1 } } }
    ]);
    summary.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} event(s)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixEventPlayFormats();
