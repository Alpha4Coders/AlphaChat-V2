import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const fixIndexes = async () => {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get all indexes
        const indexes = await usersCollection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach(index => {
            console.log(`   - ${index.name}:`, index.key);
        });

        // Drop the incorrect userName_1 index if it exists
        const indexesToDrop = ['userName_1', 'github_1'];
        
        for (const indexName of indexesToDrop) {
            try {
                await usersCollection.dropIndex(indexName);
                console.log(`\n✅ Dropped incorrect index: ${indexName}`);
            } catch (error) {
                if (error.code === 27) {
                    console.log(`\n⚠️  Index ${indexName} does not exist (already fixed)`);
                } else {
                    throw error;
                }
            }
        }

        // Verify the correct indexes exist
        const updatedIndexes = await usersCollection.indexes();
        console.log('\n📋 Updated indexes:');
        updatedIndexes.forEach(index => {
            console.log(`   - ${index.name}:`, index.key);
        });

        console.log('\n✅ Index fix completed successfully!');
        console.log('🔄 Please restart your server now.');

    } catch (error) {
        console.error('❌ Error fixing indexes:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

fixIndexes();
