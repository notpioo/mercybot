const config = require('../config/config');

function getCommandInfo(commandName) {
    const command = config.commands[commandName];
    if (!command) return null;
    
    return {
        name: commandName,
        aliases: command.aliases || [],
        description: command.description || 'No description available'
    };
}

function isOwner(userJid) {
    const ownerJids = config.owners.map(owner => owner.replace('+', '') + '@s.whatsapp.net');
    return ownerJids.includes(userJid);
}

function formatNumber(number) {
    return number.replace(/\D/g, '');
}

function formatJid(number) {
    const formatted = formatNumber(number);
    return formatted + '@s.whatsapp.net';
}

function isValidPrefix(text) {
    return config.prefixes.some(prefix => text.startsWith(prefix));
}

function extractCommand(text) {
    const prefix = config.prefixes.find(p => text.startsWith(p));
    if (!prefix) return null;
    
    const commandText = text.slice(prefix.length).trim();
    const [command, ...args] = commandText.split(' ');
    
    return {
        prefix,
        command: command.toLowerCase(),
        args,
        fullCommand: commandText
    };
}

function createVCard(name, number) {
    const cleanNumber = number.replace('+', '');
    return `BEGIN:VCARD
VERSION:3.0
FN:${name}
ORG:WhatsApp Bot
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:${number}
END:VCARD`;
}

function getCurrentTime() {
    return new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour12: false
    });
}

function formatUptime(uptime) {
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / 3600) % 24);
    const days = Math.floor(uptime / 86400);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function sanitizeText(text) {
    return text.replace(/[^\w\s\-_.]/g, '');
}

function formatJid(phoneNumber) {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleanNumber.startsWith('0')) {
        return '62' + cleanNumber.substring(1) + '@s.whatsapp.net';
    } else if (!cleanNumber.startsWith('62')) {
        return '62' + cleanNumber + '@s.whatsapp.net';
    }
    
    return cleanNumber + '@s.whatsapp.net';
}

function generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
}

module.exports = {
    getCommandInfo,
    isOwner,
    formatNumber,
    formatJid,
    isValidPrefix,
    extractCommand,
    createVCard,
    getCurrentTime,
    formatUptime,
    sanitizeText,
    generateRandomId
};
