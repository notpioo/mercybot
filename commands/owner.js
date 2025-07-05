const config = require('../config/config');

async function execute(context) {
    const { sock, remoteJid } = context;
    
    try {
        await sock.sendMessage(remoteJid, {
            text: config.messages.ownerContact
        });
        
        // Send multiple owner contacts
        const ownerContacts = config.owners.map((owner, index) => {
            const cleanNumber = owner.replace('+', '');
            return {
                displayName: `Bot Owner ${index + 1}`,
                vcard: `BEGIN:VCARD
VERSION:3.0
FN:Bot Owner ${index + 1}
ORG:WhatsApp Bot
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:${owner}
END:VCARD`
            };
        });
        
        await sock.sendMessage(remoteJid, {
            contacts: {
                displayName: 'Bot Owners',
                contacts: ownerContacts
            }
        });
        
        console.log('📞 Owner contacts sent successfully');
        
    } catch (error) {
        console.error('❌ Failed to send owner contact:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};
