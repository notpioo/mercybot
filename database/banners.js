const mongoose = require('mongoose');

// Banner Schema
const bannerSchema = new mongoose.Schema({
    bannerId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        required: true
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        default: 'system'
    }
});

// User Banner Schema - tracks which banners users own and which they have equipped
const userBannerSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    ownedBanners: [{
        bannerId: String,
        obtainedAt: {
            type: Date,
            default: Date.now
        }
    }],
    equippedBanner: {
        type: String,
        default: null // null means no banner equipped
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Banner = mongoose.model('Banner', bannerSchema);
const UserBanner = mongoose.model('UserBanner', userBannerSchema);

// Initialize banners table with default banners
const initBannersTable = async () => {
    try {
        console.log('🖼️ Initializing banners system...');

        // Check if default banners exist
        const existingBanners = await Banner.countDocuments();
        console.log(`📊 Existing banners count: ${existingBanners}`);

        if (existingBanners === 0) {
            console.log('🎨 Creating default banners...');

            // Create default banners
            const defaultBanners = [
                {
                    bannerId: 'default',
                    name: 'Default',
                    description: 'Clean minimal background',
                    imageUrl: '/banners/default-gradient.svg',
                    rarity: 'common'
                },
                {
                    bannerId: 'sunset-mountains',
                    name: 'Sunset Mountains',
                    description: 'Beautiful mountain sunset landscape',
                    imageUrl: '/banners/sunset-mountains.svg',
                    rarity: 'common'
                },
                {
                    bannerId: 'neon-city',
                    name: 'Neon City',
                    description: 'Cyberpunk cityscape with neon lights',
                    imageUrl: '/banners/neon-city.svg',
                    rarity: 'rare'
                },
                {
                    bannerId: 'space-nebula',
                    name: 'Space Nebula',
                    description: 'Cosmic nebula with stars',
                    imageUrl: '/banners/space-nebula.svg',
                    rarity: 'epic'
                },
                {
                    bannerId: 'golden-abstract',
                    name: 'Golden Abstract',
                    description: 'Luxury golden abstract design',
                    imageUrl: '/banners/golden-abstract.svg',
                    rarity: 'legendary'
                },
                {
                    bannerId: 'aurora-borealis',
                    name: 'Aurora Borealis',
                    description: 'Magical northern lights display',
                    imageUrl: '/banners/aurora-borealis.svg',
                    rarity: 'legendary'
                }
            ];

            for (const bannerData of defaultBanners) {
                const existingBanner = await Banner.findOne({ bannerId: bannerData.bannerId });
                if (!existingBanner) {
                    const banner = new Banner(bannerData);
                    await banner.save();
                    console.log(`✅ Created banner: ${bannerData.name}`);
                }
            }
        }

        console.log('✅ Banners system initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing banners system:', error);
        return false;
    }
};

// Get all active banners
const getAllBanners = async () => {
    try {
        return await Banner.find({ isActive: true }).sort({ createdAt: -1 });
    } catch (error) {
        console.error('❌ Error fetching banners:', error.message);
        return [];
    }
};

// Get banner by ID
const getBannerById = async (bannerId) => {
    try {
        return await Banner.findOne({ bannerId, isActive: true });
    } catch (error) {
        console.error('❌ Error fetching banner:', error.message);
        return null;
    }
};

// Create new banner
const createBanner = async (bannerData) => {
    try {
        const banner = new Banner(bannerData);
        await banner.save();
        console.log(`✅ Banner created: ${banner.name}`);
        return banner;
    } catch (error) {
        console.error('❌ Error creating banner:', error.message);
        return null;
    }
};

// Update banner
const updateBanner = async (bannerId, updateData) => {
    try {
        // Get current banner to preserve existing data
        const currentBanner = await Banner.findOne({ bannerId });
        if (!currentBanner) {
            console.error(`❌ Banner not found: ${bannerId}`);
            return null;
        }

        // Only update fields that are provided, preserve existing ones
        const updateFields = {};
        if (updateData.name !== undefined) updateFields.name = updateData.name;
        if (updateData.description !== undefined) updateFields.description = updateData.description;
        if (updateData.rarity !== undefined) updateFields.rarity = updateData.rarity;
        if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;

        // Only update imageUrl if a new one is provided
        if (updateData.imageUrl !== undefined && updateData.imageUrl !== '') {
            updateFields.imageUrl = updateData.imageUrl;
        }

        updateFields.updatedAt = new Date();

        const banner = await Banner.findOneAndUpdate(
            { bannerId },
            updateFields,
            { new: true }
        );

        console.log(`✅ Banner updated: ${bannerId}`, {
            updatedFields: Object.keys(updateFields),
            imageUrl: banner.imageUrl
        });
        return banner;
    } catch (error) {
        console.error('❌ Error updating banner:', error.message);
        return null;
    }
};

// Delete banner (soft delete)
const deleteBanner = async (bannerId) => {
    try {
        const banner = await Banner.findOneAndUpdate(
            { bannerId },
            { isActive: false },
            { new: true }
        );
        console.log(`✅ Banner deleted: ${bannerId}`);
        return banner;
    } catch (error) {
        console.error('❌ Error deleting banner:', error.message);
        return null;
    }
};

const getUserBanners = async (userId) => {
    try {
        console.log('🔍 Getting banners for user:', userId);

        if (!userId) {
            throw new Error('User ID is required');
        }

        let userBannerDoc = await UserBanner.findOne({ userId });

        if (!userBannerDoc) {
            console.log('📝 Creating new user banner document for:', userId);
            // Create new document with default banner
            userBannerDoc = new UserBanner({
                userId,
                ownedBanners: [{ bannerId: 'default', obtainedAt: new Date() }],
                equippedBanner: 'default'
            });
            await userBannerDoc.save();
            console.log('✅ New user banner document created');
        }

        // Ensure ownedBanners is always an array and has correct structure
        if (!Array.isArray(userBannerDoc.ownedBanners)) {
            console.log('🔧 Fixing ownedBanners array structure');
            userBannerDoc.ownedBanners = [{ bannerId: 'default', obtainedAt: new Date() }];
            await userBannerDoc.save();
        }

        // Ensure each owned banner has proper structure
        let needsSave = false;
        userBannerDoc.ownedBanners = userBannerDoc.ownedBanners.map(banner => {
            if (typeof banner === 'string') {
                needsSave = true;
                return { bannerId: banner, obtainedAt: new Date() };
            }
            if (!banner.obtainedAt) {
                needsSave = true;
                banner.obtainedAt = new Date();
            }
            return banner;
        });

        // Ensure user always has default banner
        const hasDefault = userBannerDoc.ownedBanners.some(b => b.bannerId === 'default');
        if (!hasDefault) {
            console.log('🔧 Adding default banner to user');
            userBannerDoc.ownedBanners.unshift({ bannerId: 'default', obtainedAt: new Date() });
            needsSave = true;
        }

        // Set default equipped banner if none is set
        if (!userBannerDoc.equippedBanner) {
            userBannerDoc.equippedBanner = 'default';
            needsSave = true;
        }

        if (needsSave) {
            await userBannerDoc.save();
            console.log('✅ User banner document updated and saved');
        }

        console.log('📋 User banner document:', {
            userId: userBannerDoc.userId,
            ownedBannersCount: userBannerDoc.ownedBanners.length,
            ownedBanners: userBannerDoc.ownedBanners.map(b => ({ bannerId: b.bannerId, obtainedAt: b.obtainedAt })),
            equippedBanner: userBannerDoc.equippedBanner
        });

        return {
            userId: userBannerDoc.userId,
            ownedBanners: userBannerDoc.ownedBanners || [],
            equippedBanner: userBannerDoc.equippedBanner || 'default',
            createdAt: userBannerDoc.createdAt,
            updatedAt: userBannerDoc.updatedAt
        };
    } catch (error) {
        console.error('❌ Error getting user banners:', error);
        console.error('❌ Error stack:', error.stack);
        // Return safe default structure on error
        return {
            userId,
            ownedBanners: [{ bannerId: 'default', obtainedAt: new Date() }],
            equippedBanner: 'default',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
};

// Add banner to user
const addBannerToUser = async (userId, bannerId) => {
    try {
        // Get or create user banner document
        let userBannerDoc = await UserBanner.findOne({ userId });

        if (!userBannerDoc) {
            userBannerDoc = new UserBanner({
                userId,
                ownedBanners: [{ bannerId: 'default', obtainedAt: new Date() }],
                equippedBanner: 'default'
            });
        }

        // Check if user already owns this banner
        const alreadyOwns = userBannerDoc.ownedBanners.some(b => b.bannerId === bannerId);
        if (alreadyOwns) {
            console.log(`⚠️ User ${userId} already owns banner ${bannerId}`);
            return { success: false, message: 'User already owns this banner' };
        }

        // Add the banner
        userBannerDoc.ownedBanners.push({ bannerId, obtainedAt: new Date() });
        userBannerDoc.updatedAt = new Date();
        await userBannerDoc.save();

        console.log(`✅ Banner ${bannerId} added to user ${userId}. Total owned: ${userBannerDoc.ownedBanners.length}`);
        return { success: true, message: 'Banner added successfully' };
    } catch (error) {
        console.error('❌ Error adding banner to user:', error.message);
        return { success: false, message: 'Failed to add banner' };
    }
};

// Equip banner for user
const equipBanner = async (userId, bannerId) => {
    try {
        const userBanners = await getUserBanners(userId);

        if (bannerId && bannerId !== 'default') {
            // Check if user owns this banner
            const ownsThisBanner = userBanners.ownedBanners.some(b => b.bannerId === bannerId);
            if (!ownsThisBanner) {
                return { success: false, message: 'You do not own this banner' };
            }
        }

        // Update user's equipped banner
        await UserBanner.updateOne(
            { userId },
            { 
                equippedBanner: bannerId,
                updatedAt: new Date()
            },
            { upsert: true }
        );

        console.log(`✅ Banner ${bannerId || 'removed'} equipped for user ${userId}`);
        return { success: true, message: bannerId ? 'Banner equipped successfully' : 'Banner removed successfully' };
    } catch (error) {
        console.error('❌ Error equipping banner:', error);
        return { success: false, message: 'Failed to equip banner' };
    }
};

// Get user's equipped banner
const getUserEquippedBanner = async (userId) => {
    try {
        const userBanners = await getUserBanners(userId);
        if (!userBanners.equippedBanner) {
            return null;
        }
        return await getBannerById(userBanners.equippedBanner);
    } catch (error) {
        console.error('❌ Error fetching equipped banner:', error.message);
        return null;
    }
};

module.exports = {
    Banner,
    UserBanner,
    initBannersTable,
    getAllBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    getUserBanners,
    addBannerToUser,
    equipBanner,
    getUserEquippedBanner
};