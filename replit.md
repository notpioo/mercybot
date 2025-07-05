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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```