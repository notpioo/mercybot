
const mongoose = require('mongoose');
const config = require('../config/config');

async function fixLimitData() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(config.mongodb.uri, config.mongodb.options);
        console.log('✅ MongoDB connected successfully!');

        const { User } = require('../lib/database');
        
        // Find users with string limit that is not "unlimited"
        const usersWithInvalidLimit = await User.find({
            limit: { $type: "string", $ne: "unlimited" }
        });
        
        console.log(`Found ${usersWithInvalidLimit.length} users with invalid limit data`);
        
        // Fix users with invalid limit data
        for (const user of usersWithInvalidLimit) {
            const numericLimit = parseInt(user.limit) || config.userSystem.defaultLimit;
            await User.updateOne(
                { _id: user._id },
                { $set: { limit: numericLimit } }
            );
            console.log(`Fixed limit for user ${user.jid}: "${user.limit}" -> ${numericLimit}`);
        }
        
        console.log('✅ Limit data fix completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to fix limit data:', error);
        process.exit(1);
    }
}

fixLimitData();
