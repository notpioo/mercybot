const { formatShop } = require('../utils/fishingUtils');

async function fshopCommand(sock, from, sender, args, message) {
    try {
        // Format and send shop
        const shopMessage = formatShop();
        
        await sock.sendMessage(from, {
            text: shopMessage
        });
        
        return true;

    } catch (error) {
        console.error('Error in fshop command:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menampilkan shop. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'fshop',
    description: 'Melihat fishing shop (rod, bait)',
    usage: '.fshop',
    category: 'fishing',
    execute: fshopCommand
};