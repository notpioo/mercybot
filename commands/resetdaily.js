const { resetUserDailyLogin } = require('../lib/dailyLoginModel');
const { isOwner } = require('../utils/helpers');

async function execute(context) {
    const { sock, remoteJid, user, senderName, args, senderJid } = context;
    
    try {
        // Check if user is owner
        if (!isOwner(senderJid)) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Command ini hanya untuk owner bot!'
            });
            return;
        }
        
        if (!args[0] || args[0] === '') {
            await sock.sendMessage(remoteJid, {
                text: `❌ *FORMAT SALAH!*\n\n` +
                      `📖 *Usage:* .resetdaily @user\n` +
                      `📖 *Contoh:* .resetdaily @6285123456789\n\n` +
                      `💡 *Info:* Command ini akan mereset daily login user sehingga mereka bisa claim lagi dari Day 1`
            });
            return;
        }
        
        // Extract phone number from mention or direct input
        let targetNumber = args[0];
        
        // Remove @ if exists
        if (targetNumber.startsWith('@')) {
            targetNumber = targetNumber.substring(1);
        }
        
        // Format to WhatsApp JID
        const targetJid = targetNumber.includes('@') ? targetNumber : `${targetNumber}@s.whatsapp.net`;
        
        // Reset user's daily login
        const result = await resetUserDailyLogin(targetJid);
        
        if (result.success) {
            await sock.sendMessage(remoteJid, {
                text: `✅ *DAILY LOGIN RESET BERHASIL!*\n\n` +
                      `👤 *Target:* ${targetNumber}\n` +
                      `🔄 *Status:* Daily login telah direset\n` +
                      `📅 *Streak:* Kembali ke 0\n` +
                      `🎁 *Day:* Kembali ke Day 1\n\n` +
                      `💡 User sekarang bisa claim daily login lagi dari awal!`
            });
        } else {
            let errorMessage = '❌ *GAGAL RESET DAILY LOGIN*\n\n';
            
            if (result.reason === 'user_not_found') {
                errorMessage += '👤 User tidak ditemukan dalam database daily login.\n' +
                              'Pastikan user pernah menggunakan fitur daily login sebelumnya.';
            } else {
                errorMessage += '🔧 Terjadi kesalahan sistem.\n' +
                              'Coba lagi nanti atau periksa log untuk detail error.';
            }
            
            await sock.sendMessage(remoteJid, { text: errorMessage });
        }
        
    } catch (error) {
        console.error('❌ Failed to execute resetdaily command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ Terjadi kesalahan saat mereset daily login. Coba lagi nanti.'
        });
    }
}

module.exports = {
    execute,
    description: 'Reset daily login user (Owner only)',
    usage: 'resetdaily @user',
    category: 'owner'
};