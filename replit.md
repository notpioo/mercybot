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
- July 20, 2025. Successfully completed project migration from Replit Agent to standard Replit environment
- July 20, 2025. Separated profile page functionality into modular profile-system.js file for better code organization
- July 20, 2025. Redesigned profile page to match base template design with more compact, elegant styling
- July 20, 2025. Fixed profile page sizing issues to maintain consistency with other dashboard pages
- July 20, 2025. Extracted all navigation components (desktop, mobile, dropdowns, bottom sheet) to separate navigation-system.js module
- July 20, 2025. Cleaned up dashboard-system.js by removing 600+ lines of navigation code and importing from navigation module
- July 20, 2025. Improved code organization with modular architecture: dashboard routes, profile system, and navigation system as separate files
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```