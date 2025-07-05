module.exports = {
    // Bot Configuration
    botName: "WhatsApp Bot",
    owners: ["+6285709557572", "+6283895472636", "+628973062538"], // Multi-owner support
    prefixes: [".", "!", "/"],

    // MongoDB Configuration
    mongodb: {
        uri:
            process.env.MONGODB_URI ||
            "mongodb+srv://pioo:Avionika27@cluster0.feboa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        options: {
            // Remove deprecated options
        },
    },

    // Session Configuration
    sessionPath: "./sessions",

    // Bot Settings
    settings: {
        autoRead: true,
        autoTyping: false,
        selfBot: false,
        groupOnly: false,
        privateOnly: false,
    },

    // User System Configuration
    userSystem: {
        defaultStatus: "basic",
        defaultLimit: 30,
        defaultBalance: 0,
        defaultChips: 0,
        maxWarnings: 3,
        statuses: {
            owner: {
                name: "Owner",
                limit: "unlimited",
                permissions: ["all"],
            },
            premium: {
                name: "Premium",
                limit: "unlimited",
                permissions: ["premium", "basic"],
            },
            basic: {
                name: "Basic",
                limit: 30,
                permissions: ["basic"],
            },
            admin: {
                name: "Admin",
                limit: "unlimited",
                permissions: ["admin", "basic"],
            },
        },
    },

    // Commands Configuration
    commands: {
        owner: {
            aliases: ["owner", "creator"],
            description: "Get owner contact information",
            permission: "basic",
            useLimit: false,
        },
        menu: {
            aliases: ["menu", "help", "commands"],
            description: "Show available commands",
            permission: "basic",
            useLimit: false,
        },
        profile: {
            aliases: ["profile", "me", "my"],
            description: "Show your profile information",
            permission: "basic",
            useLimit: false,
        },
        addbalance: {
            aliases: ["addbalance", "addbal"],
            description: "Add balance to user",
            permission: "owner",
            useLimit: false,
        },
        delbalance: {
            aliases: ["delbalance", "delbal"],
            description: "Remove balance from user",
            permission: "owner",
            useLimit: false,
        },
        addchip: {
            aliases: ["addchip", "addchips"],
            description: "Add chips to user",
            permission: "owner",
            useLimit: false,
        },
        delchip: {
            aliases: ["delchip", "delchips"],
            description: "Remove chips from user",
            permission: "owner",
            useLimit: false,
        },
        addlimit: {
            aliases: ["addlimit"],
            description: "Add limit to user",
            permission: "owner",
            useLimit: false,
        },
        dellimit: {
            aliases: ["dellimit"],
            description: "Remove limit from user",
            permission: "owner",
            useLimit: false,
        },
        addprem: {
            aliases: ["addprem", "addpremium"],
            description: "Add premium status to user",
            permission: "owner",
            useLimit: false,
        },
        delprem: {
            aliases: ["delprem", "delpremium"],
            description: "Remove premium status from user",
            permission: "owner",
            useLimit: false,
        },
        ban: {
            aliases: ["ban"],
            description: "Ban user for specified duration",
            permission: "owner",
            useLimit: false,
        },
        unban: {
            aliases: ["unban"],
            description: "Unban user",
            permission: "owner",
            useLimit: false,
        },
        resetlimit: {
            aliases: ["resetlimit"],
            description: "Reset daily limit for all users",
            permission: "owner",
            useLimit: false,
        },
        warn: {
            aliases: ["warn"],
            description: "Warn user",
            permission: "admin",
            useLimit: false,
        },
        maxwarn: {
            aliases: ["maxwarn"],
            description: "Set maximum warnings",
            permission: "owner",
            useLimit: false,
        },
        prem: {
            aliases: ["prem"],
            description: "Check premium status and duration",
            permission: "owner",
            useLimit: false,
        },
        listprem: {
            aliases: ["listprem"],
            description: "List all premium users",
            permission: "owner",
            useLimit: false,
        },
        listban: {
            aliases: ["listban"],
            description: "List all banned users",
            permission: "owner",
            useLimit: false,
        },
        listwarn: {
            aliases: ["listwarn"],
            description: "List all users with warnings",
            permission: "owner",
            useLimit: false,
        },
        add: {
            aliases: ["add"],
            description: "Add user to group",
            permission: "owner",
            useLimit: false,
        },
        kick: {
            aliases: ["kick", "remove"],
            description: "Remove user from group",
            permission: "owner",
            useLimit: false,
        },
        tagall: {
            aliases: ["tagall", "mentionall"],
            description: "Mention all group members",
            permission: "owner",
            useLimit: false,
        },
        antibadword: {
            aliases: ["antibadword"],
            description: "Toggle anti-badword filter",
            permission: "owner",
            useLimit: false,
        },
        addbadword: {
            aliases: ["addbadword", "addword"],
            description: "Add bad words to filter",
            permission: "admin",
            useLimit: false,
        },
        delbadword: {
            aliases: ["delbadword"],
            description: "Remove bad words from filter",
            permission: "admin",
            useLimit: false,
        },
        listbadword: {
            aliases: ["listbadword", "listbadwords"],
            description: "List all bad words",
            permission: "basic",
            useLimit: false,
        },
        grouplink: {
            aliases: ["grouplink", "link", "invite"],
            description: "Get group invite link",
            permission: "owner",
            useLimit: false,
        },
        forceadd: {
            aliases: ["forceadd"],
            description: "Force add user to group",
            permission: "owner",
            useLimit: false,
        },
        directinvite: {
            aliases: ["directinvite", "dinvite"],
            description: "Direct invite user to group",
            permission: "owner",
            useLimit: false,
        },
        manualinvite: {
            aliases: ["manualinvite", "minvite"],
            description: "Manual invite user to group",
            permission: "owner",
            useLimit: false,
        },
        delwarn: {
            aliases: ["delwarn"],
            description: "Remove warning from user",
            permission: "admin",
            useLimit: false,
        },
        resetwarn: {
            aliases: ["resetwarn"],
            description: "Reset user warnings or all warnings",
            permission: "owner",
            useLimit: false,
        },
        promote: {
            aliases: ["promote"],
            description: "Promote user to admin",
            permission: "owner",
            useLimit: false,
        },
        demote: {
            aliases: ["demote"],
            description: "Demote admin to member",
            permission: "owner",
            useLimit: false,
        },
        groupmanage: {
            aliases: ["groupmanage", "group"],
            description: "Manage group settings",
            permission: "owner",
            useLimit: false,
        },
        antivc: {
            aliases: ["antivc", "antiviewonce"],
            description: "Toggle anti view once feature",
            permission: "admin",
            useLimit: false,
        },
    },

    // Messages
    messages: {
        greeting: "👋 Halo! Saya adalah bot asisten WhatsApp Anda.",
        ownerContact: "👤 Berikut adalah kontak owner saya:",
        commandNotFound:
            "❌ Command tidak ditemukan. Ketik .menu untuk melihat command yang tersedia.",
        error: "❌ Terjadi kesalahan saat memproses permintaan Anda.",
        processing: "⏳ Memproses permintaan Anda...",
        success: "✅ Operasi berhasil diselesaikan!",
        invalidFormat: "❌ Format tidak valid. Silakan periksa command Anda.",
        premiumRequired: "💎 Fitur ini hanya untuk pengguna premium.",
        groupOnly: "👥 Command ini hanya dapat digunakan dalam grup.",
        privateOnly: "🔒 Command ini hanya dapat digunakan dalam chat pribadi.",
        noPermission: "❌ Anda tidak memiliki izin untuk menggunakan command ini.",
        userNotFound: "❌ Pengguna tidak ditemukan.",
        alreadyExists: "❌ Sudah ada.",
        notFound: "❌ Tidak ditemukan.",
        limitExceeded: "⚠️ Anda telah melebihi batas harian.",
        serverError: "❌ Server error. Silakan coba lagi nanti.",
        underMaintenance: "🔧 Bot sedang dalam pemeliharaan. Silakan coba lagi nanti.",
        bannedUser: "🚫 Anda dilarang menggunakan bot ini.",
        cooldown: "⏰ Silakan tunggu sebelum menggunakan command ini lagi.",
        missingArguments: "❌ Argumen yang diperlukan tidak ada.",
        invalidArguments: "❌ Argumen yang diberikan tidak valid.",
        userBanned: "🚫 Pengguna telah dilarang.",
        userUnbanned: "✅ Pengguna telah dibuka larangannya.",
        userPromoted: "⬆️ Pengguna telah dipromosikan menjadi admin.",
        userDemoted: "⬇️ Pengguna telah diturunkan menjadi member.",
        userKicked: "👢 Pengguna telah dikeluarkan dari grup.",
        userAdded: "➕ Pengguna telah ditambahkan ke grup.",
        groupClosed: "🔒 Grup telah ditutup.",
        groupOpened: "🔓 Grup telah dibuka.",
        welcomeEnabled: "👋 Pesan selamat datang diaktifkan.",
        welcomeDisabled: "👋 Pesan selamat datang dinonaktifkan.",
        antilinkEnabled: "🔗 Antilink diaktifkan.",
        antilinkDisabled: "🔗 Antilink dinonaktifkan.",
        antibadwordEnabled: "🚫 Anti-badword diaktifkan.",
        antibadwordDisabled: "🚫 Anti-badword dinonaktifkan.",
        warningIssued: "⚠️ Peringatan diberikan!",
        warningRemoved: "✅ Peringatan dihapus.",
        allWarningsCleared: "🧹 Semua peringatan dibersihkan.",
        maxWarningsReached: "🚨 Peringatan maksimum tercapai! Pengguna akan dikeluarkan.",
        balanceAdded: "💰 Saldo berhasil ditambahkan.",
        balanceRemoved: "💸 Saldo berhasil dikurangi.",
        chipsAdded: "🎰 Chip berhasil ditambahkan.",
        chipsRemoved: "🎰 Chip berhasil dikurangi.",
        limitAdded: "📈 Limit berhasil ditambahkan.",
        limitRemoved: "📉 Limit berhasil dikurangi.",
        premiumAdded: "💎 Status premium ditambahkan.",
        premiumRemoved: "💎 Status premium dihapus.",
        limitReset: "🔄 Limit berhasil direset."
    },
};