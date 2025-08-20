// Fishing Game Configuration
const fishingConfig = {
    // Rod Configuration
    rods: {
        wood: {
            id: 'wood',
            name: 'Wood Rod',
            rarity: 'common',
            price: 0, // default rod
            fishCount: 1,
            rarityBonus: 0, // no bonus for common rod
            emoji: '🎣'
        },
        bamboo: {
            id: 'bamboo',
            name: 'Bamboo Rod',
            rarity: 'common',
            price: 500,
            fishCount: 2,
            rarityBonus: 5,
            emoji: '🎋'
        },
        steel: {
            id: 'steel',
            name: 'Steel Rod',
            rarity: 'uncommon',
            price: 2000,
            fishCount: 3,
            rarityBonus: 15,
            emoji: '⚙️'
        },
        carbon: {
            id: 'carbon',
            name: 'Carbon Fiber Rod',
            rarity: 'rare',
            price: 5000,
            fishCount: 4,
            rarityBonus: 25,
            emoji: '🏗️'
        },
        legendary: {
            id: 'legendary',
            name: 'Legendary Rod',
            rarity: 'legendary',
            price: 15000,
            fishCount: 6,
            rarityBonus: 50,
            emoji: '✨'
        }
    },

    // Bait Configuration
    baits: {
        worm: {
            id: 'worm',
            name: 'Worm',
            rarity: 'common',
            price: 0, // default bait
            quantity: 1, // default quantity received
            rarityBonus: 0,
            emoji: '🪱'
        },
        cricket: {
            id: 'cricket',
            name: 'Cricket',
            rarity: 'common',
            price: 50,
            quantity: 10, // get 10 crickets for 50 RC
            rarityBonus: 10,
            emoji: '🦗'
        },
        shrimp: {
            id: 'shrimp',
            name: 'Shrimp',
            rarity: 'uncommon',
            price: 150,
            quantity: 8, // get 8 shrimps for 150 RC
            rarityBonus: 20,
            emoji: '🦐'
        },
        squid: {
            id: 'squid',
            name: 'Squid',
            rarity: 'rare',
            price: 400,
            quantity: 5, // get 5 squids for 400 RC
            rarityBonus: 35,
            emoji: '🦑'
        },
        golden: {
            id: 'golden',
            name: 'Golden Lure',
            rarity: 'legendary',
            price: 1000,
            quantity: 3, // get 3 golden lures for 1000 RC
            rarityBonus: 60,
            emoji: '🎁'
        }
    },

    // Fish Configuration
    fish: {
        // Common Fish
        sardine: {
            id: 'sardine',
            name: 'Sardine',
            rarity: 'common',
            basePrice: 10,
            emoji: '🐟',
            weight: { min: 0.1, max: 0.3 }
        },
        mackerel: {
            id: 'mackerel',
            name: 'Mackerel',
            rarity: 'common',
            basePrice: 15,
            emoji: '🐠',
            weight: { min: 0.2, max: 0.5 }
        },
        carp: {
            id: 'carp',
            name: 'Carp',
            rarity: 'common',
            basePrice: 25,
            emoji: '🐡',
            weight: { min: 0.5, max: 1.0 }
        },

        // Uncommon Fish
        bass: {
            id: 'bass',
            name: 'Bass',
            rarity: 'uncommon',
            basePrice: 50,
            emoji: '🐟',
            weight: { min: 1.0, max: 2.5 }
        },
        trout: {
            id: 'trout',
            name: 'Trout',
            rarity: 'uncommon',
            basePrice: 75,
            emoji: '🐠',
            weight: { min: 1.5, max: 3.0 }
        },
        salmon: {
            id: 'salmon',
            name: 'Salmon',
            rarity: 'uncommon',
            basePrice: 100,
            emoji: '🍣',
            weight: { min: 2.0, max: 4.0 }
        },

        // Rare Fish
        tuna: {
            id: 'tuna',
            name: 'Tuna',
            rarity: 'rare',
            basePrice: 200,
            emoji: '🐟',
            weight: { min: 5.0, max: 15.0 }
        },
        swordfish: {
            id: 'swordfish',
            name: 'Swordfish',
            rarity: 'rare',
            basePrice: 350,
            emoji: '🗡️',
            weight: { min: 10.0, max: 25.0 }
        },
        marlin: {
            id: 'marlin',
            name: 'Marlin',
            rarity: 'rare',
            basePrice: 500,
            emoji: '🐠',
            weight: { min: 15.0, max: 40.0 }
        },

        // Epic Fish
        shark: {
            id: 'shark',
            name: 'Shark',
            rarity: 'epic',
            basePrice: 1000,
            emoji: '🦈',
            weight: { min: 50.0, max: 150.0 }
        },
        whale: {
            id: 'whale',
            name: 'Baby Whale',
            rarity: 'epic',
            basePrice: 1500,
            emoji: '🐋',
            weight: { min: 100.0, max: 300.0 }
        },

        // Legendary Fish
        kraken: {
            id: 'kraken',
            name: 'Kraken',
            rarity: 'legendary',
            basePrice: 5000,
            emoji: '🐙',
            weight: { min: 500.0, max: 1000.0 }
        },
        leviathan: {
            id: 'leviathan',
            name: 'Leviathan',
            rarity: 'legendary',
            basePrice: 10000,
            emoji: '🐉',
            weight: { min: 1000.0, max: 2000.0 }
        }
    },

    // Rarity chances (base percentages)
    rarityChances: {
        common: 60,
        uncommon: 25,
        rare: 10,
        epic: 4,
        legendary: 1
    },

    // Rarity colors for display
    rarityColors: {
        common: '⚪',
        uncommon: '🟢', 
        rare: '🔵',
        epic: '🟣',
        legendary: '🟡'
    },

    // Fishing cooldown (in seconds)
    fishingCooldown: 300, // 5 minutes

    // Experience points for fishing
    experience: {
        common: 5,
        uncommon: 15,
        rare: 40,
        epic: 100,
        legendary: 300
    },

    // Level requirements for XP
    levelRequirements: [
        0, 100, 250, 500, 1000, 2000, 4000, 7500, 12000, 20000, 35000
    ]
};

module.exports = fishingConfig;