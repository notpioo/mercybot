const { FishingUser } = require('../database/fishing');
const { formatInventory } = require('../utils/fishingUtils');

async function fbagCommand(sock, from, sender, args, message) {
    try {
        // Get or create fishing user
        let fishingUser = await FishingUser.findOne({ userId: sender });
        if (!fishingUser) {
            fishingUser = new FishingUser({ userId: sender });
            await fishingUser.save();
        }
        
        return true;

        // Format and send inventory
        const inventoryMessage = formatInventory(fishingUser);
        
        await sock.sendMessage(from, {
            text: inventoryMessage
        });

    } catch (error) {
        console.error('Error in fbag command:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal mengambil data inventory. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'fbag',
    description: 'Melihat inventory fishing (ikan, rod, bait)',
    usage: '.fbag',
    category: 'fishing',
    execute: fbagCommand
};