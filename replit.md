# Seana Bot - WhatsApp Bot System

## Overview
Seana Bot is a Node.js-based WhatsApp bot providing automated messaging services via the WhatsApp Web API (Baileys library). It features a command-based interface, user management, rate limiting, MongoDB integration for persistent data, and a comprehensive fishing minigame with ReelCoin (RC) currency system. The bot is fully operational, supporting WhatsApp connection via QR code scanning, and includes a web-based admin management interface for the fishing system with bait quantity management. The project aims to provide a robust, interactive bot experience with social features and a separate fishing economy using ReelCoin currency.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Runtime**: Node.js with JavaScript
- **WhatsApp Integration**: `@whiskeysockets/baileys` library for WhatsApp Web API
- **Database**: MongoDB with Mongoose ODM
- **Architecture Pattern**: Modular command-based system with handlers for extensibility and maintenance.

### Key Design Decisions
- **Modular Command System**: Each command is a separate module.
- **User Management**: Comprehensive user system with status levels, limits, and resource tracking.
- **Error Handling**: Centralized error handling with user-friendly messages.
- **Authentication**: WhatsApp Web authentication using multi-file auth state.
- **UI/UX Decisions**: Responsive web dashboard with 3-tab navigation for social features and admin management, featuring modern design and enhanced visual clarity for elements like banners and profile photos.
- **Feature Specifications**:
    - Complete fishing minigame with 8 WhatsApp commands and CRUD operations via an admin web interface.
    - ReelCoin (RC) currency system specifically for fishing minigame economy, separate from regular balance.
    - Bait quantity system where purchasing one bait item provides multiple units (configurable via admin interface).
    - Enhanced Fish Management web interface with quantity field for bait configuration.
    - Social page with 3-tab navigation (Post, Feed, Friends) and a comprehensive friends management system (search, requests, lists).
    - Robust ranking system with dynamic updates based on user levels and configurable XP requirements.
    - Profile management with editable username and profile photo, displaying both regular balance and ReelCoin.
    - Sticker creation feature from images.
- **System Design Choices**:
    - Prefix-based commands ('.').
    - Rate limiting for commands to prevent abuse.
    - Permission levels: Owner, Premium, Basic.
    - Auto-registration for new users on first interaction.
    - Resource management for users (limits, balance, chips).
    - Activity tracking (last activity, membership duration).
    - Multi-platform deployment support (Replit, Railway, Docker).
    - Auto-reconnection for WhatsApp disconnections and MongoDB connection pooling.
    - Scalability considerations: Modular commands, database indexing, resource limits, session persistence.
    - Security features: Multi-level user access control, rate limiting, input validation, error sanitization.

### Data Flow
1. **Message Reception**: WhatsApp messages received via Baileys.
2. **Command Parsing**: Message text parsed for command prefix and arguments.
3. **User Authentication**: User retrieved/created from database with permission validation.
4. **Rate Limiting**: Command limit requirements checked against user resources.
5. **Command Execution**: Appropriate command handler invoked with validated parameters.
6. **Response Generation**: Bot sends formatted response back to WhatsApp.
7. **State Updates**: User limits and activity updated in database.

## External Dependencies

### Core Dependencies
- `@whiskeysockets/baileys`: Primary library for WhatsApp Web API integration.
- `mongoose`: ODM for MongoDB object modeling.
- `qrcode-terminal`: Used for displaying QR codes for WhatsApp authentication.
- `@hapi/boom`: Utilized for error handling.
- `sharp`: Image processing library for sticker generation.
- `wa-sticker-formatter`: Library for formatting and embedding metadata into WhatsApp stickers.

### Database Schema
- **Users Collection**: Stores user data, including permissions, resources, activity, and reelCoin field for fishing currency.
- **Friend Schema**: Manages relationships and status for the friends system.
- **Fishing Database**: Stores user inventory, statistics, equipment tracking, and configuration for fishing minigame with ReelCoin integration.
- **Authentication State**: File-based persistence for WhatsApp session.

### Deployment-Specific Tools
- **Docker**: For containerization and multi-platform deployment.
- **Docker Compose**: For local development environment setup.
- **Railway-specific configuration files**: (`railway.json`, `railway.toml`) for Railway deployment.