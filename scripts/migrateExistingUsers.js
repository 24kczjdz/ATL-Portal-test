/**
 * Migration Script: Set Approved Status for Existing Users
 * 
 * This script updates all existing users in the database to have approved: true
 * Run this once after deploying the account approval system to ensure existing
 * users can continue to log in.
 * 
 * Usage: node scripts/migrateExistingUsers.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { models } from '../server/database.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateUsers() {
    try {
        console.log('🔄 Starting user migration...');
        console.log('📦 Connecting to MongoDB...');
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Find all users where approved is not set or is false
        const usersToUpdate = await models.USER.find({
            $or: [
                { approved: { $exists: false } },
                { approved: null },
                { approved: false }
            ]
        });
        
        console.log(`📊 Found ${usersToUpdate.length} users to update`);
        
        if (usersToUpdate.length === 0) {
            console.log('✅ No users need migration. All users already have approved status.');
            await mongoose.connection.close();
            return;
        }
        
        // Ask for confirmation
        console.log('\n⚠️  This will set approved: true for the following users:');
        usersToUpdate.forEach(user => {
            console.log(`   - ${user.User_ID} (${user.Email_Address}) - Role: ${user.User_Role}`);
        });
        
        console.log('\n🔄 Updating users...');
        
        // Update all users to approved: true
        const result = await models.USER.updateMany(
            {
                $or: [
                    { approved: { $exists: false } },
                    { approved: null },
                    { approved: false }
                ]
            },
            {
                $set: { approved: true }
            }
        );
        
        console.log(`✅ Migration completed successfully!`);
        console.log(`   - Modified: ${result.modifiedCount} users`);
        console.log(`   - Matched: ${result.matchedCount} users`);
        
        // Verify the migration
        const unapprovedCount = await models.USER.countDocuments({ approved: false });
        console.log(`\n📊 Verification:`);
        console.log(`   - Unapproved users remaining: ${unapprovedCount}`);
        
        if (unapprovedCount === 0) {
            console.log('✅ All existing users are now approved!');
        } else {
            console.log('⚠️  Some users are still unapproved (these may be new registrations)');
        }
        
        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Migration complete. Database connection closed.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateUsers();

