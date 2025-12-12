import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const updateEventPlayFormats = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...\n');

    // Get all events
    const events = await Event.find({}).select('name format playFormat tournament');

    if (events.length === 0) {
      console.log('No events found.');
      process.exit(0);
    }

    console.log('Current Events:\n');
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name}`);
      console.log(`   Format: ${event.format}`);
      console.log(`   Play Format: ${event.playFormat || 'NOT SET'}`);
      console.log('');
    });

    console.log('\nAvailable Play Formats:');
    console.log('1. round-robin');
    console.log('2. single-elimination');
    console.log('3. double-elimination');
    console.log('4. pool-play');
    console.log('5. swiss\n');

    // Update each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\nEvent ${i + 1}: ${event.name}`);
      console.log(`Current play format: ${event.playFormat || 'NOT SET'}`);

      const answer = await question('Enter new play format (1-5) or press Enter to skip: ');

      if (answer.trim()) {
        const playFormats = ['round-robin', 'single-elimination', 'double-elimination', 'pool-play', 'swiss'];
        const selectedFormat = playFormats[parseInt(answer) - 1];

        if (selectedFormat) {
          event.playFormat = selectedFormat;
          await event.save();
          console.log(`✓ Updated to: ${selectedFormat}`);
        } else {
          console.log('Invalid selection, skipped.');
        }
      } else {
        console.log('Skipped.');
      }
    }

    console.log('\n✅ Update complete!');
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
};

updateEventPlayFormats();
