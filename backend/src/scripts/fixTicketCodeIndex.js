import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const fixTicketCodeIndex = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    console.log('🔍 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Drop the old ticketCode index if it exists
    const ticketCodeIndex = indexes.find(idx => idx.key && idx.key.ticketCode);

    if (ticketCodeIndex) {
      console.log(`🗑️  Dropping old index: ${ticketCodeIndex.name}`);
      await collection.dropIndex(ticketCodeIndex.name);
      console.log('✅ Old index dropped');
    } else {
      console.log('ℹ️  No ticketCode index found to drop');
    }

    // Create new sparse index
    console.log('🔨 Creating new sparse index...');
    await collection.createIndex(
      { ticketCode: 1 },
      {
        unique: true,
        sparse: true,
        name: 'ticketCode_1'
      }
    );
    console.log('✅ New sparse index created');

    console.log('🔍 Verifying new indexes...');
    const newIndexes = await collection.indexes();
    const newTicketCodeIndex = newIndexes.find(idx => idx.key && idx.key.ticketCode);

    if (newTicketCodeIndex) {
      console.log('✅ New index details:', {
        name: newTicketCodeIndex.name,
        unique: newTicketCodeIndex.unique,
        sparse: newTicketCodeIndex.sparse
      });
    }

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

fixTicketCodeIndex();
