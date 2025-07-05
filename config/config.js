module.exports = {
    // Bot Configuration
    botName: "WhatsApp Bot",
    owners: ["+6285709557572", "+6283895472636"], // Multi-owner support
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
        defaultStatus: 'basic',
        defaultLimit: 30,
        defaultBalance: 0,
        defaultChips: 0,
        maxWarn: 3,
        statuses: {
            owner: {
                name: 'Owner',
                limit: 'unlimited',
                permissions: ['all']
            },
            premium: {
                name: 'Premium',
                limit: 'unlimited',
                permissions: ['premium', 'basic']
            },
            basic: {
                name: 'Basic',
                limit: 30,
                permissions: ['basic']
            }
        }
    },

    // Commands Configuration
    commands: {
        owner: {
            aliases: ["owner", "creator"],
            description: "Get owner contact information",
            permission: 'basic',
            useLimit: false
        },
        menu: {
            aliases: ["menu", "help", "commands"],
            description: "Show available commands",
            permission: 'basic',
            useLimit: false
        },
        profile: {
            aliases: ["profile", "me", "my"],
            description: "Show your profile information",
            permission: 'basic',
            useLimit: false
        },
        addbalance: {
            aliases: ["addbalance", "addbal"],
            description: "Add balance to user",
            permission: 'owner',
            useLimit: false
        },
        delbalance: {
            aliases: ["delbalance", "delbal"],
            description: "Remove balance from user",
            permission: 'owner',
            useLimit: false
        },
        addchip: {
            aliases: ["addchip", "addchips"],
            description: "Add chips to user",
            permission: 'owner',
            useLimit: false
        },
        delchip: {
            aliases: ["delchip", "delchips"],
            description: "Remove chips from user",
            permission: 'owner',
            useLimit: false
        },
        addlimit: {
            aliases: ["addlimit"],
            description: "Add limit to user",
            permission: 'owner',
            useLimit: false
        },
        dellimit: {
            aliases: ["dellimit"],
            description: "Remove limit from user",
            permission: 'owner',
            useLimit: false
        },
        addprem: {
            aliases: ["addprem", "addpremium"],
            description: "Add premium status to user",
            permission: 'owner',
            useLimit: false
        },
        delprem: {
            aliases: ["delprem", "delpremium"],
            description: "Remove premium status from user",
            permission: 'owner',
            useLimit: false
        },
        ban: {
            aliases: ["ban"],
            description: "Ban user for specified duration",
            permission: 'owner',
            useLimit: false
        },
        unban: {
            aliases: ["unban"],
            description: "Unban user",
            permission: 'owner',
            useLimit: false
        },
        resetlimit: {
            aliases: ["resetlimit"],
            description: "Reset daily limit for all users",
            permission: 'owner',
            useLimit: false
        },
        warn: {
            aliases: ["warn"],
            description: "Warn user",
            permission: 'owner',
            useLimit: false
        },
        maxwarn: {
            aliases: ["maxwarn"],
            description: "Set maximum warnings",
            permission: 'owner',
            useLimit: false
        },
        prem: {
            aliases: ["prem"],
            description: "Check premium status and duration",
            permission: 'owner',
            useLimit: false
        },
        listprem: {
            aliases: ["listprem"],
            description: "List all premium users",
            permission: 'owner',
            useLimit: false
        },
        listban: {
            aliases: ["listban"],
            description: "List all banned users",
            permission: 'owner',
            useLimit: false
        },
        listwarn: {
            aliases: ["listwarn"],
            description: "List all users with warnings",
            permission: 'owner',
            useLimit: false
        },
        add: {
            aliases: ["add"],
            description: "Add user to group",
            permission: 'owner',
            useLimit: false
        },
        kick: {
            aliases: ["kick"],
            description: "Remove user from group",
            permission: 'owner',
            useLimit: false
        }
    },

    // Messages
    messages: {
        greeting: "👋 Hello! I am your WhatsApp assistant bot.",
        ownerContact: "👤 Here is my owner contact:",
        commandNotFound:
            "❌ Command not found. Type .menu to see available commands.",
        error: "❌ An error occurred while processing your request.",
        processing: "⏳ Processing your request...",
    },
};
