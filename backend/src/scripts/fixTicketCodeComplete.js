import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const fixTicketCodeComplete = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    // Step 1: Check existing documents
    console.log('\n📊 Checking existing payments...');
    const totalPayments = await collection.countDocuments();
    const paymentsWithNullTicket = await collection.countDocuments({ ticketCode: null });
    const paymentsWithTicket = await collection.countDocuments({ ticketCode: { $ne: null } });

    console.log(`Total payments: ${totalPayments}`);
    console.log(`Payments with null ticketCode: ${paymentsWithNullTicket}`);
    console.log(`Payments with valid ticketCode: ${paymentsWithTicket}`);

    // Step 2: Remove ticketCode field from documents where it's null
    if (paymentsWithNullTicket > 0) {
      console.log('\n🧹 Removing ticketCode field from null values...');
      const result = await collection.updateMany(
        { ticketCode: null },
        { $unset: { ticketCode: "" } }
      );
      console.log(`✅ Updated ${result.modifiedCount} documents`);
    }

    // Step 3: Drop ALL indexes on ticketCode
    console.log('\n🗑️  Dropping all ticketCode indexes...');
    const indexes = await collection.indexes();

    for (const index of indexes) {
      if (index.key && index.key.ticketCode) {
        console.log(`Dropping index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped ${index.name}`);
        } catch (err) {
          console.log(`⚠️  Could not drop ${index.name}: ${err.message}`);
        }
      }
    }

    // Step 4: Create new sparse unique index
    console.log('\n🔨 Creating new sparse unique index...');
    await collection.createIndex(
      { ticketCode: 1 },
      {
        unique: true,
        sparse: true,
        name: 'ticketCode_1'
      }
    );
    console.log('✅ Created sparse unique index');

    // Step 5: Verify the index
    console.log('\n🔍 Verifying index configuration...');
    const newIndexes = await collection.indexes();
    const ticketCodeIndex = newIndexes.find(idx => idx.key && idx.key.ticketCode);

    if (ticketCodeIndex) {
      console.log('✅ Index verified:');
      console.log(JSON.stringify(ticketCodeIndex, null, 2));

      if (ticketCodeIndex.sparse === true && ticketCodeIndex.unique === true) {
        console.log('✅ Index is correctly configured as sparse and unique');
      } else {
        console.log('❌ Index configuration is incorrect!');
        console.log('Sparse:', ticketCodeIndex.sparse);
        console.log('Unique:', ticketCodeIndex.unique);
      }
    } else {
      console.log('❌ ticketCode index not found!');
    }

    // Step 6: Test insert
    console.log('\n🧪 Testing duplicate null inserts...');
    try {
      // Try to insert two test documents without ticketCode (should succeed)
      const testDoc1 = {
        user: new mongoose.Types.ObjectId(),
        tournament: new mongoose.Types.ObjectId(),
        amount: 100,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const testDoc2 = {
        user: new mongoose.Types.ObjectId(),
        tournament: new mongoose.Types.ObjectId(),
        amount: 200,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result1 = await collection.insertOne(testDoc1);
      console.log('✅ Test insert 1 succeeded');

      const result2 = await collection.insertOne(testDoc2);
      console.log('✅ Test insert 2 succeeded');

      // Clean up test documents
      await collection.deleteMany({ _id: { $in: [result1.insertedId, result2.insertedId] } });
      console.log('🧹 Test documents cleaned up');

      console.log('\n✅ SUCCESS! Multiple documents without ticketCode can be inserted');
    } catch (error) {
      console.log('\n❌ FAILED! Error inserting test documents:');
      console.log(error.message);
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

fixTicketCodeComplete();
