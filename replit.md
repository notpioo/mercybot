# WhatsApp Bot

## Overview

This is a WhatsApp bot application built with Node.js using the Baileys library for WhatsApp integration and MongoDB for data persistence. The bot provides a command-based interface for interacting with users through WhatsApp messages, supporting both private and group chats.

## System Architecture

### Frontend Architecture
- **WhatsApp Interface**: The bot communicates through WhatsApp using the Baileys library
- **QR Code Terminal**: Uses qrcode-terminal for authentication display
- **No traditional web frontend**: All interactions happen through WhatsApp messages

### Backend Architecture
- **Node.js Runtime**: Main application server
- **Event-driven Architecture**: Uses WhatsApp socket events for message handling
- **Command Pattern**: Modular command system for extensibility
- **Middleware Pattern**: Message preprocessing and validation

### Database Layer
- **MongoDB**: Primary database using Mongoose ODM
- **User Management**: Stores user profiles, command usage statistics, and permissions
- **Group Management**: Tracks group information and participant data
- **Session Management**: Handles WhatsApp authentication state

## Key Components

### Core Components
1. **WhatsApp Client** (`lib/whatsapp.js`)
   - Manages WhatsApp socket connection
   - Handles authentication and reconnection logic
   - Processes incoming messages and connection updates

2. **Message Handler** (`lib/messageHandler.js`)
   - Routes messages to appropriate commands
   - Manages user context and permissions
   - Handles command parsing and validation

3. **Database Layer** (`lib/database.js`)
   - User and group data models
   - Database connection management
   - CRUD operations for user/group entities

4. **Command System** (`commands/`)
   - Modular command structure
   - Owner commands for bot management
   - Menu system for user guidance

5. **Configuration** (`config/config.js`)
   - Centralized configuration management
   - Bot settings and message templates
   - MongoDB connection strings

### Command Architecture
- **Owner Commands**: Admin-only functionality (owner contact)
- **General Commands**: Available to all users (menu, help)
- **Extensible Design**: Easy to add new commands through the commands directory

### Authentication System
- **Multi-file Auth State**: Persistent WhatsApp session management
- **Owner Verification**: Role-based access control
- **User Tracking**: Automatic user registration and activity logging

## Data Flow

1. **Message Reception**: WhatsApp message received through Baileys socket
2. **Message Processing**: Extract text, sender info, and chat context
3. **User Management**: Create/update user record in MongoDB
4. **Command Parsing**: Extract command and arguments from message
5. **Command Execution**: Route to appropriate command handler
6. **Response Generation**: Format and send response back to WhatsApp
7. **Logging**: Track command usage and user activity

## External Dependencies

### Core Dependencies
- **@whiskeysockets/baileys**: WhatsApp Web API client
- **mongoose**: MongoDB object modeling
- **qrcode-terminal**: QR code display for authentication

### Database
- **MongoDB Atlas**: Cloud-hosted MongoDB instance
- **Connection String**: Configured for cluster0.feboa.mongodb.net

### WhatsApp Integration
- **Baileys Library**: Handles all WhatsApp protocol communication
- **Multi-device Support**: Compatible with WhatsApp multi-device architecture
- **Session Persistence**: Maintains login state across restarts

## Deployment Strategy

### Process Management
- **Graceful Shutdown**: Handles SIGINT signals properly
- **Error Handling**: Comprehensive error catching and logging
- **Auto-restart**: Reconnection logic for network failures

### Session Management
- **Local Session Storage**: Stores auth state in ./sessions directory
- **Persistent Authentication**: Maintains login between restarts
- **QR Code Generation**: Fallback authentication method

### Configuration
- **Environment Variables**: Supports environment-based configuration
- **Default Values**: Fallback configuration for development
- **Centralized Config**: Single source of truth for all settings

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Fixed MongoDB duplicate key error by implementing proper error handling and database cleanup script
- July 05, 2025. Bot successfully connected and running without errors
- July 05, 2025. Implemented multi-owner support with proper vCard format for contact sharing
- July 05, 2025. Fixed syntax errors and updated all owner-related functions to support multiple owners
- July 05, 2025. Corrected owner data format and added third prefix "/" - All configurations stored locally in config.js only
- July 05, 2025. Implemented comprehensive user profile system with status levels (owner/premium/basic), balance, chips, and limit management
- July 05, 2025. Added permission-based command system and daily usage limits for basic users (30 commands per day)
- July 05, 2025. Created profile command that displays user photo, name, tag, status, limit, balance, chips, and member since date
- July 05, 2025. Enhanced profile command to support viewing other users' profiles via mention (@username)
- July 05, 2025. Updated tag format to use proper WhatsApp mention format (@phonenumber) instead of username
- July 05, 2025. Implemented comprehensive owner management system with 12 new commands
- July 05, 2025. Added balance/chips management commands (addbalance, delbalance, addchip, delchip)
- July 05, 2025. Added limit management commands (addlimit, dellimit, resetlimit)
- July 05, 2025. Added premium status management with time-based expiration (addprem, delprem)
- July 05, 2025. Added ban/unban system with automatic expiration checking
- July 05, 2025. Added warning system with configurable max warnings and auto-kick functionality
- July 05, 2025. Enhanced user schema with warnings, banUntil, and premiumUntil fields
- July 05, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 05, 2025. Added comprehensive group management system with owner/admin commands
- July 05, 2025. Implemented anti-badword system with automatic detection and warning
- July 05, 2025. Added new commands: add, kick, tagall, antibadword, addbadword
- July 05, 2025. Integrated automatic user kicking when reaching maximum warnings (3)
- July 05, 2025. Enhanced invitation system with multiple methods (add, directinvite, manualinvite, forceadd)
- July 05, 2025. Added owner warning management commands (delwarn, resetwarn)
- July 05, 2025. Added admin promotion/demotion commands (promote, demote)
- July 05, 2025. Added badword list viewing command (listbadword)
- July 05, 2025. Implemented auto-delete feature for messages containing badwords
- July 05, 2025. Fixed invitation link clickability with separate message sending
- July 05, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 05, 2025. Verified all dependencies install correctly without vulnerabilities
- July 05, 2025. Confirmed MongoDB connection and owner user setup working properly
- July 05, 2025. Fixed anti view once feature that was not working due to message filtering issues
- July 05, 2025. Enhanced view once detection to support ephemeral messages and direct formats
- July 05, 2025. Added comprehensive error handling for badword detection function
- July 05, 2025. Improved message processing to handle media messages without text content
- July 05, 2025. Replaced automatic anti view once system with manual reply-based command
- July 05, 2025. Command .antivc now works by replying to view once messages instead of automatic detection
- July 05, 2025. Removed all automatic view once detection functions for better performance and reliability
- July 05, 2025. Implemented both manual (.antivc reply) and automatic (.antivc on/off) anti-view-once systems
- July 05, 2025. Added local file download system with downloads/ folder for security
- July 05, 2025. Added Railway deployment compatibility with Node.js 20+ configuration
- July 05, 2025. Fixed database schema for antiViewOnce settings in group.settings object
- July 06, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 06, 2025. Implemented secure owner-only QR code access system for deployment environments
- July 06, 2025. Created authentication-protected web interface for QR code scanning
- July 06, 2025. Fixed deployment QR code visibility issue with owner verification system
- July 06, 2025. Implemented responsive navigation system with top navigation for desktop and bottom navigation for mobile
- July 06, 2025. Created new page structure: Home, Squad, Games, and Profile with elegant dark theme
- July 06, 2025. Rebranded from "WhatsApp Bot" to "NoMercy" with lightning bolt logo (⚡)
- July 06, 2025. Added currency display in top navigation showing balance and chips
- July 06, 2025. Fixed currency data synchronization between database and dashboard display
- July 06, 2025. Updated all login flows to redirect to new /home page instead of /dashboard
- July 06, 2025. Redesigned login and welcome pages with NoMercy dark elegant theme
- July 06, 2025. Fixed verification page theme to match NoMercy dark elegant design
- July 06, 2025. Corrected redirect after successful verification to go to /home instead of /dashboard
- July 06, 2025. Implemented mobile top navigation showing brand name and currency for screens below desktop size
- July 06, 2025. Fixed routing conflict between web-server.js and dashboard-system.js landing pages
- July 06, 2025. Updated all landing pages to use consistent NoMercy dark theme branding
- July 06, 2025. Resolved duplicate route handlers to prevent routing conflicts
- July 09, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 09, 2025. Verified all dependencies install correctly without vulnerabilities
- July 09, 2025. Confirmed MongoDB connection and WhatsApp authentication working properly
- July 09, 2025. Implemented comprehensive sticker creation command (.stiker)
- July 09, 2025. Added support for image to sticker conversion using Sharp library
- July 09, 2025. Added support for video to animated sticker conversion using FFmpeg
- July 09, 2025. Command supports both direct image send with caption and reply to media messages
- July 09, 2025. Fixed sticker command handler registration and downloadMediaMessage function usage
- July 09, 2025. Added sticker pack name and author metadata to generated stickers (NoMercy Sticker Pack)
- July 09, 2025. Reorganized configuration structure with separate config files for better maintainability
- July 09, 2025. Created config/messages.js for centralized message management
- July 09, 2025. Created config/database.js for database configuration and defaults
- July 09, 2025. Enhanced sticker configuration with customizable pack name, author, quality, and dimensions
- July 09, 2025. Added comprehensive view once message support to sticker command
- July 09, 2025. Installed additional dependencies: node-webpmux, file-type, mime-types for better media handling
- July 09, 2025. Enhanced sticker command with improved media extraction from viewOnceMessage and ephemeralMessage
- July 09, 2025. Added detailed debug logging for troubleshooting view once message processing
- July 09, 2025. Improved wa-sticker-formatter implementation with proper metadata embedding
- July 09, 2025. Fixed getMessageText function to properly read captions from view once messages (viewOnceMessage and viewOnceMessageV2)
- July 09, 2025. Bot now fully supports commands sent as captions in view once images/videos
- July 09, 2025. View once sticker creation working properly with both reply method and direct caption method
- July 09, 2025. Fixed maxwarn system to be per-group instead of global setting
- July 09, 2025. Added maxWarnings field to group schema with default value of 3
- July 09, 2025. Updated warn and maxwarn commands to use group-specific maxWarnings setting
- July 09, 2025. Each group can now have different maxwarn values (1-10), stored in database
- July 10, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 10, 2025. Fixed critical bug in daily reward system where users got wrong rewards
- July 10, 2025. Daily rewards now correctly give rewards based on current day instead of previous day
- July 10, 2025. Added resetdaily command for owners to reset user's daily login progress
- July 10, 2025. Updated menu system to include daily login and reset daily commands
- July 10, 2025. Fixed daily reward logic to properly handle Day 1 through Day 7 rewards
- July 10, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 10, 2025. Fixed critical bug in daily reward system - Day 1 was giving Day 7 reward (premium instead of chips)
- July 10, 2025. Corrected reward logic to give proper reward based on user's current day
- July 10, 2025. Added resetdaily command for owner to reset user's daily login progress
- July 10, 2025. Updated menu system to include daily login commands and reset functionality
- July 10, 2025. Fixed critical daily login logic bug - users now properly start from Day 1 instead of jumping to Day 2
- July 10, 2025. Implemented proper reward calculation based on day being claimed, not day after increment
- July 10, 2025. Added web dashboard reset daily login feature for admin with proper phone number formatting
- July 10, 2025. Enhanced daily login system with correct streak and day progression logic
- July 10, 2025. Implemented Mines casino game with full web interface using chips currency
- July 10, 2025. Added interactive Mines game with 4 grid sizes (25, 36, 49, 64), adjustable mine count, and real-time multiplier system
- July 10, 2025. Created API endpoints for chips management (/api/user/chips GET and /api/user/update-chips POST)
- July 10, 2025. Updated mines page navigation in dashboard to link to actual playable game at /games/mines
- July 10, 2025. Successfully completed migration from Replit Agent to standard Replit environment
- July 10, 2025. Fixed critical syntax error in dashboard-system.js that was causing Railway deployment crashes
- July 10, 2025. Removed duplicate HTML content from dashboard-system.js around line 1892
- July 10, 2025. All dependencies installed successfully, MongoDB connection working, web server running on port 3000
- July 10, 2025. Bot running successfully with QR code generation for WhatsApp authentication
- July 10, 2025. Implemented comprehensive Mines casino statistics and leaderboard system using MongoDB
- July 10, 2025. Created complete database models for tracking Mines games, user stats, and leaderboard rankings
- July 10, 2025. Built professional statistics dashboard with detailed game analytics and performance metrics
- July 10, 2025. Added interactive leaderboard with podium display, filtering options, and real-time rankings
- July 10, 2025. Integrated API endpoints for stats tracking, game creation, and leaderboard management
- July 13, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 13, 2025. Fixed profile command bug where owners showed as basic status instead of owner
- July 13, 2025. Enhanced profile command to properly check config-based owner status
- July 13, 2025. Updated database owner creation to ensure existing owners get proper status
- July 13, 2025. Modified badword detection system so group admins now receive warnings
- July 13, 2025. Only bot owners are now exempt from badword warnings and deletion
- July 13, 2025. Group admins who reach max warnings won't be auto-kicked but get special warning message
- July 13, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 13, 2025. Fixed profile command bug where owner status was not displayed correctly
- July 13, 2025. Updated owner status detection to properly check config owners and override database status
- July 13, 2025. Enhanced createOwnerUser function to update existing owner users with correct status
- July 13, 2025. Implemented comprehensive level system with 9 tiers (Warrior, Elite, Master, Grandmaster, Epic, Legend, Mythic, Honor, Immortal)
- July 13, 2025. Created level utilities and reward management system with MongoDB schemas for level/tier rewards
- July 13, 2025. Updated daily login system to award EXP points alongside balance/chips rewards
- July 13, 2025. Enhanced profile command to display level information (level, tier, experience, progress)
- July 13, 2025. Built admin panel for configuring level rewards per level and per tier with toggle functionality
- July 13, 2025. Created level command for WhatsApp with reward claiming functionality
- July 13, 2025. Implemented milestone reward system with claimable rewards for level progression
- July 13, 2025. Successfully refactored dashboard-system.js (7743 lines) into organized modular structure
- July 13, 2025. Created dashboard directory with separate files: middleware.js, navigation.js, templates.js, and routes/
- July 13, 2025. Split routes into separate files: home.js, news.js, profile.js, api.js for better maintainability
- July 13, 2025. Maintained all existing functionality and UI appearance while improving code organization
- July 13, 2025. Added admin button in profile page for owner role accounts that redirects to admin dashboard
- July 13, 2025. Created comprehensive admin dashboard with news management functionality
- July 13, 2025. Implemented news system with MongoDB model and API endpoints for CRUD operations
- July 13, 2025. Updated news page to display only active announcements fetched from database
- July 13, 2025. Added admin routes for news management with create, read, update, delete capabilities
- July 13, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 13, 2025. Fixed package dependencies and resolved compilation issues with Python and Sharp
- July 13, 2025. Completely removed all admin dashboard functionality as requested by user
- July 13, 2025. Removed admin routes, API endpoints, and admin panel from profile page
- July 13, 2025. WhatsApp Bot running successfully with web dashboard (minus admin features)
- July 13, 2025. Restored admin dashboard with proper owner role authentication
- July 13, 2025. Added admin panel button in profile page for owner users only
- July 13, 2025. Implemented complete admin dashboard with news management functionality
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```