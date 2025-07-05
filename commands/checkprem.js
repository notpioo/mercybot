const config = require("../config/config");
const { getUser } = require("../lib/database");
const { formatJid } = require("../utils/helpers");

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } =
        context;

    try {
        // Check if user is owner
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: "❌ Cuman owner yang bisa pake command ini😝.",
            });
            return;
        }

        // Get target user (from mention or phone number)
        let targetJid = null;

        // Check if there's a mention
        if (
            message.message?.extendedTextMessage?.contextInfo?.mentionedJid
                ?.length > 0
        ) {
            targetJid =
                message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args.length >= 1) {
            // Format phone number
            const phoneNumber = args[0].replace(/\D/g, "");
            if (phoneNumber.length >= 10) {
                targetJid = formatJid(phoneNumber);
            }
        }

        if (!targetJid) {
            await sock.sendMessage(remoteJid, {
                text: `❌ Gunakan: ${config.prefixes[0]}${commandName} @mention/number\n\nContoh: ${config.prefixes[0]}${commandName} @user\nContoh: ${config.prefixes[0]}${commandName} 6285709557572`,
            });
            return;
        }

        // Get target user
        const targetUser = await getUser(targetJid);

        // Check premium status
        let statusText = "";
        let premiumInfo = "";

        if (targetUser.status === "premium" && targetUser.premiumUntil) {
            const now = new Date();
            const premiumUntil = new Date(targetUser.premiumUntil);

            if (premiumUntil > now) {
                const timeLeft = premiumUntil - now;
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor(
                    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                );
                const minutes = Math.floor(
                    (timeLeft % (1000 * 60 * 60)) / (1000 * 60),
                );

                statusText = "👑 Pengguna premium";
                premiumInfo = `⏰ Sampai: ${premiumUntil.toLocaleString("id-ID")}\n⏱️ Waktu tersisa: ${days}d ${hours}h ${minutes}m`;
            } else {
                statusText = "⚠️ Premium Expired";
                premiumInfo = `⏰ Expired on: ${premiumUntil.toLocaleString("id-ID")}`;
            }
        } else if (targetUser.status === "owner") {
            statusText = "👤 Owner (Permanent Premium)";
            premiumInfo = "⏰ Duration: Unlimited";
        } else {
            statusText = "👥 Basic User";
            premiumInfo = "⏰ No premium status";
        }

        const responseText = `╭─「 Premium Status 」
│ 👤 User: ${targetUser.name || "Unknown"}
│ 📱 Number: ${targetJid.split("@")[0]}
│ 
│ ${statusText}
│ ${premiumInfo}
╰────────────────`;

        await sock.sendMessage(remoteJid, {
            text: responseText,
            mentions: [targetJid],
        });

        console.log(`👑 ${commandName} executed by ${senderName}`);
    } catch (error) {
        console.error(`❌ Failed to execute ${commandName}:`, error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error,
        });
    }
}

module.exports = {
    execute,
};
