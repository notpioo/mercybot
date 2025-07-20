// Import configurations
const database = require('./database');
const messages = require('./messages');
const pin = require('./pin');

module.exports = {
    // Bot Configuration
    botName: "WhatsApp Bot",
    owners: ["+6285709557572", "+6283895472636", "+628973062538"], // Multi-owner support
    prefixes: [".", "!", "/"],

    // MongoDB Configuration
    mongodb: database.mongodb,

    // Session Configuration
    sessionPath: "./sessions",

    // Sticker Configuration
    sticker: {
        packName: "Seana Bot",
        authorName: "pioo",
        quality: 80,
        maxSize: 10 * 1024 * 1024, // 10MB
        dimensions: {
            width: 512,
            height: 512
        }
    },

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
            permission: "admin",
            useLimit: false,
        },
        del: {
            aliases: ["del", "delete"],
            description: "Delete replied message",
            permission: "admin",
            useLimit: false,
        },
        opengc: {
            aliases: ["opengc", "open"],
            description: "Open group chat",
            permission: "admin",
            useLimit: false,
        },
        closegc: {
            aliases: ["closegc", "close"],
            description: "Close group chat",
            permission: "admin",
            useLimit: false,
        },
        setppgrup: {
            aliases: ["setppgrup", "setgrouppp"],
            description: "Set group profile picture",
            permission: "admin",
            useLimit: false,
        },
        setpp: {
            aliases: ["setpp", "setbotpp"],
            description: "Set bot profile picture",
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
        stiker: {
            aliases: ["stiker", "sticker", "s"],
            description: "Convert image/video to sticker",
            permission: "basic",
            useLimit: true,
        },
    },

    // Messages
    messages: messages,

    // PIN Configuration
    pin: pin,

    // Database Configuration
    database: database,
};