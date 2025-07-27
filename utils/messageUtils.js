const config = require('../config/config');

/**
 * Extract command and arguments from message text
 * @param {string} messageText - The message text
 * @returns {Object} Command and arguments
 */
const parseCommand = (messageText) => {
    if (!messageText || !messageText.startsWith(config.commands.prefix)) {
        return { command: null, args: [] };
    }
    
    const parts = messageText.slice(config.commands.prefix.length).trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    return { command, args };
};

/**
 * Check if message is a command
 * @param {string} messageText - The message text
 * @returns {boolean} Is command status
 */
const isCommand = (messageText) => {
    return messageText && messageText.startsWith(config.commands.prefix);
};

/**
 * Format user mention
 * @param {string} userId - WhatsApp user ID
 * @returns {string} Formatted mention
 */
const formatMention = (userId) => {
    const phoneNumber = userId.split('@')[0];
    return `@${phoneNumber}`;
};

/**
 * Extract phone number from user ID
 * @param {string} userId - WhatsApp user ID
 * @returns {string} Phone number
 */
const extractPhoneNumber = (userId) => {
    return userId.split('@')[0];
};

/**
 * Format currency display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency type (balance, chips)
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'balance') => {
    const symbols = {
        balance: '💰',
        chips: '🎯'
    };
    
    return `${symbols[currency] || '💰'} ${amount.toLocaleString()}`;
};

/**
 * Format time ago
 * @param {Date} date - Date to format
 * @returns {string} Time ago string
 */
const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
};

/**
 * Clean and validate message text
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
const cleanMessageText = (text) => {
    if (!text) return '';
    
    return text
        .trim()
        .replace(/\n+/g, '\n') // Remove excessive newlines
        .replace(/\s+/g, ' ') // Remove excessive spaces
        .substring(0, 1000); // Limit length
};

/**
 * Create error message
 * @param {string} error - Error message
 * @param {string} command - Command that caused error
 * @returns {string} Formatted error message
 */
const createErrorMessage = (error, command = '') => {
    return `❌ Error${command ? ` in command .${command}` : ''}: ${error}`;
};

/**
 * Create success message
 * @param {string} message - Success message
 * @param {string} command - Command that succeeded
 * @returns {string} Formatted success message
 */
const createSuccessMessage = (message, command = '') => {
    return `✅${command ? ` .${command}` : ''}: ${message}`;
};

/**
 * Validate WhatsApp user ID format
 * @param {string} userId - User ID to validate
 * @returns {boolean} Is valid format
 */
const isValidUserId = (userId) => {
    if (!userId || typeof userId !== 'string') return false;
    
    // Check for valid WhatsApp ID format
    const whatsappIdPattern = /^\d+@(s\.whatsapp\.net|g\.us)$/;
    return whatsappIdPattern.test(userId);
};

/**
 * Generate random ID
 * @param {number} length - Length of ID
 * @returns {string} Random ID
 */
const generateRandomId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

module.exports = {
    parseCommand,
    isCommand,
    formatMention,
    extractPhoneNumber,
    formatCurrency,
    formatTimeAgo,
    cleanMessageText,
    createErrorMessage,
    createSuccessMessage,
    isValidUserId,
    generateRandomId
};
