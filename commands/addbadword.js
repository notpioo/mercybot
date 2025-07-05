const config = require("../config/config");
const { getUser, getGroup, Group } = require("../lib/database");

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } =
        context;

    try {
        // Check if it's a group chat
        if (!remoteJid.endsWith("@g.us")) {
            await sock.sendMessage(remoteJid, {
                text: "❌ Command ini hanya dapat digunakan dalam group.",
            });
            return;
        }

        // Get group info and check if user is admin/owner
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.find(
            (p) =>
                p.id === user.jid &&
                (p.admin === "admin" || p.admin === "superadmin"),
        );

        if (!user.isOwner && !isAdmin) {
            await sock.sendMessage(remoteJid, {
                text: "❌ Cuman admin yang bisa pake command ini😝.",
            });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: "❌ Harap berikan kata-kata yang ingin ditambahkan ke daftar kata-kata kasar.\n\nPenggunaan: .addbadword kata1 kata2 kata3\n\nContoh: .addbadword spam scam fake",
            });
            return;
        }

        // Get or create group data
        let group = await getGroup(remoteJid);
        if (!group) {
            group = new Group({
                jid: remoteJid,
                name: groupMetadata.subject || "Unknown Group",
                desc: groupMetadata.desc || "",
                participants: groupMetadata.participants.length,
                settings: {
                    antiBadword: false,
                    badWords: [],
                },
            });
        }

        // Normalize input words (lowercase)
        const newWords = args
            .map((word) => word.toLowerCase().trim())
            .filter((word) => word.length > 0);

        // Get existing badwords
        const existingWords = group.settings.badWords || [];

        // Find words that are already in the list
        const duplicates = newWords.filter((word) =>
            existingWords.includes(word),
        );

        // Find new words to add
        const wordsToAdd = newWords.filter(
            (word) => !existingWords.includes(word),
        );

        if (wordsToAdd.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: `❌ Kata ini sudah berada dalam list badword.\n\nkata: ${duplicates.join(", ")}`,
            });
            return;
        }

        // Add new words to the list
        group.settings.badWords = [...existingWords, ...wordsToAdd];
        await group.save();

        let responseMessage = `✅ Berhasil menambahkan ${wordsToAdd.length} Badword(s):\n`;
        responseMessage += `➕ Ditambahkan: ${wordsToAdd.join(", ")}\n`;

        if (duplicates.length > 0) {
            responseMessage += `⚠️ Sudah ada: ${duplicates.join(", ")}\n`;
        }

        responseMessage += `\n📊 Total badwords: ${group.settings.badWords.length}`;

        if (!group.settings.antiBadword) {
            responseMessage +=
                "\n\n💡 Tip: Gunakan .antibadword on untuk mengaktifkan anti badword.";
        }

        await sock.sendMessage(remoteJid, {
            text: responseMessage,
        });
    } catch (error) {
        console.error("Error in addbadword command:", error);
        await sock.sendMessage(remoteJid, {
            text: "❌ An error occurred while adding badwords.",
        });
    }
}

module.exports = { execute };
