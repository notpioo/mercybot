const { FishingUser } = require('../database/fishing');
const { formatFishingStats } = require('../utils/fishingUtils');
const { getUser } = require('../utils/userUtils');

async function fishingCommand(sock, from, sender, args, message) {
    try {
        console.log(`🎣 Fishing command for sender: ${sender}`);
        
        // Get or create fishing user
        let fishingUser = await FishingUser.findOne({ userId: sender });
        if (!fishingUser) {
            fishingUser = new FishingUser({ userId: sender });
            await fishingUser.save();
            console.log(`🎣 Created new fishing user: ${sender}`);
        }

        // Get main user data for username
        const mainUser = await getUser(sender);
        const username = mainUser ? mainUser.username : sender.split('@')[0];
        
        console.log(`🎣 Found fishing user for ${username}: Level ${fishingUser.level}`);

        // Format and send fishing stats
        const statsMessage = formatFishingStats(fishingUser, username);
        
        await sock.sendMessage(from, {
            text: statsMessage
        });
        
        return true;

    } catch (error) {
        console.error('Error in fishing stats command:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal mengambil data fishing. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'fishing',
    description: 'Melihat dashboard statistik fishing',
    usage: '.fishing',
    category: 'fishing',
    execute: fishingCommand
};