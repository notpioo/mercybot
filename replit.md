# Seana Bot - WhatsApp Bot System

## Overview

Seana Bot is a WhatsApp bot built using Node.js that provides automated messaging services through the WhatsApp Web API via Baileys library. The bot features a command-based interface with user management, rate limiting, and MongoDB integration for persistent data storage. Bot is fully operational and ready for WhatsApp connection via QR code scanning.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 4, 2025)

✅ **Project Migration from Replit Agent Completed Successfully**
- Successfully migrated WhatsApp Bot project from Replit Agent to standard Replit environment
- **Fixed critical bug in profile collection tab switching - banner tab now correctly displays banners collection**
- **Fixed JavaScript error in switchCollection function that caused wrong collection to display**
- **Fixed banner collection loading issue - banners now render properly after shop purchases**
- **Enhanced banner rendering with proper debugging and immediate display (removed loading delay)**
- **Improved banner ownership and equipped status detection logic**
- **Increased banner card size for better visibility - banner images now 40px wider and 30px taller**
- **Enhanced banner preview dimensions from 100x50px to 140x80px for improved visual clarity**
- **Made main profile banner larger and more prominent - increased height from 120px to 300px**
- **Enhanced profile banner display area with better spacing and responsive design**
- **Optimized banner positioning with profile photo overlapping the banner for better visual balance**
- **Added horizontal scrolling support for both border and banner collections for better navigation**
- **Moved edit profile and logout buttons to top-right position next to username for better accessibility**
- **Added Inventory button to main navigation dropdown menu under List section**
- All required packages installed and verified working correctly
- WhatsApp Bot workflow restarted and running smoothly with QR code generation
- MongoDB database connected and all systems operational (announcements, posts, borders, banners, shop)
- Project now runs cleanly in Replit environment with proper security practices
- All migration checklist items completed successfully

## Previous Changes (August 3, 2025)

✅ **Project Migration and Border Manager Grid Enhancement Completed Successfully**
- Successfully migrated WhatsApp Bot project from Replit Agent to standard Replit environment
- **Fixed border manager grid layout with improved responsive design**
- **Enhanced mobile and tablet layouts for better user experience**
- **Improved card spacing, sizing, and visual hierarchy in borders grid**
- **Added proper responsive breakpoints for optimal viewing across all devices**
- **Rebuilt grid system with modern design patterns and smooth animations**
- **Optimized card dimensions and button styling for better UX**
- All dependencies verified and security vulnerabilities addressed
- WhatsApp Bot workflow running correctly with QR code generation
- MongoDB database connected and all systems operational

## Previous Changes (July 28, 2025)

✅ **Project Migration and Rank System Update Completed Successfully**
- Successfully migrated WhatsApp Bot project from Replit Agent to standard Replit environment
- Fixed critical syntax error in server.js that was preventing startup
- Resolved navigation dropdown menu layout issue - now displays as wide horizontal menu
- Fixed profile page level display bug - level now updates properly from database changes
- **Fixed rank system to update dynamically with level changes**
- **Changed XP requirements from medium to easy difficulty (50% less XP needed)**
- **Removed duplicate ranks from configuration and cleaned up rank system**
- **Fixed totalXp display to show real data from database instead of placeholder values**
- **Recalculated and corrected all users' totalXp values based on their current level**
- **Added Edit Profile functionality with modal interface for updating username and profile photo**
- **Created profile photo upload system with database integration and real-time preview**
- **Fixed horizontal scrolling issue on profile page with responsive CSS design**
- **Fixed "updateUser is not defined" error by adding missing import**
- **Made username and profile photo fields optional - users can update either or both**
- **Added mobile-responsive layout with proper breakpoints for tablets and phones**
- All dependencies verified and properly installed with security vulnerabilities addressed  
- WhatsApp Bot workflow running correctly with QR code generation
- Web server functional on port 5000 with MongoDB connection established
- User management system working correctly with real-time database updates

## Previous Changes (July 27, 2025)

✅ **Migration to Replit Completed Successfully**
- Migrated project from Replit Agent to standard Replit environment
- Fixed integration between WhatsApp bot and web server components
- Resolved QR code loading issue in web interface
- Bot and web server now run simultaneously on single workflow
- All features verified working: QR generation, web interface, bot commands

✅ **Complete Web Dashboard with Advanced Navigation System Built**
- Created comprehensive navigation system with desktop (top nav + dropdown) and mobile (top + bottom nav + sheet) layouts
- Implemented 4 main navigation menus: home, news, profile, list with extensive submenus
- Built responsive navigation components: desktop dropdown, mobile bottom sheet, sticky positioning
- Created complete page templates: home, news, profile, shop, redeem, member, quest, mine
- Implemented proper user authentication flow and data integration across all pages
- Added currency display, user status indicators, and owner-specific navigation items
- Navigation system is modular and reusable across all dashboard pages

✅ **Railway Deployment Support Added**
- Created comprehensive Docker configuration with multi-stage builds
- Added Railway-specific configuration files (railway.json, railway.toml)
- Implemented proper environment variable handling for production
- Created deployment documentation and automation scripts
- Added Docker Compose for local development with MongoDB

✅ **Bot Successfully Deployed and Running**
- Fixed TypeScript syntax error in connection handler
- Resolved MongoDB connection issues by removing deprecated options
- Removed duplicate schema index warnings
- WhatsApp connection established with QR code display
- All commands (.menu, .ping, .profile, .s/.sticker) implemented and tested
- Owner number configured: 6285709557572
- Database connected to MongoDB Atlas cluster

✅ **Profile Command Enhanced**
- Username now fetched from actual WhatsApp profile name using pushName
- Removed limit deduction notification for cleaner UX
- Profile command now sends user's profile picture with caption
- Silent limit deduction without user notification
- Improved error handling for profile data fetching

✅ **Sticker Feature Added**
- Implemented .s/.sticker commands for image to sticker conversion
- Support for reply to images (including view once images)
- Support for images sent with command caption
- Sticker pack: "seana bot", author: "pioo" as configured
- Dependencies installed: sharp, wa-sticker-formatter for proper metadata
- Comprehensive error handling and user feedback
- Automatic image resizing to 512x512 WebP format
- Fixed metadata implementation using wa-sticker-formatter library
- Proper EXIF data embedding for WhatsApp sticker pack information
- Sticker command now requires 1 limit to use

✅ **Bot System Updates**
- Dynamic bot name in menu from config (SEANA BOT MENU)
- Updated status system: owner/premium/basic (removed admin)
- Unlimited limits for owner and premium users (∞ unlimited)
- Owner automatically gets owner status upon first interaction
- Profile display shows "∞ (unlimited)" for owner/premium users
- Enhanced limit checking system with unlimited status support

## System Architecture

### Backend Architecture
- **Runtime**: Node.js with JavaScript
- **WhatsApp Integration**: @whiskeysockets/baileys library for WhatsApp Web API
- **Database**: MongoDB with Mongoose ODM
- **Architecture Pattern**: Modular command-based system with handlers

### Key Design Decisions
- **Modular Command System**: Each command is a separate module for easy maintenance and extensibility
- **User Management**: Comprehensive user system with status levels, limits, and resource tracking
- **Error Handling**: Centralized error handling with user-friendly messages
- **Authentication**: WhatsApp Web authentication using multi-file auth state

## Key Components

### Core Components
1. **Main Bot Class (SeanaBot)**: Central orchestrator handling WhatsApp connection and initialization
2. **Command Handler**: Routes and executes user commands with permission checks
3. **User Management**: Handles user creation, authentication, and resource management
4. **Database Models**: Mongoose schemas for user data persistence

### Command System
- **Prefix-based Commands**: Uses '.' as command prefix
- **Rate Limiting**: Commands can require "limit" consumption to prevent abuse
- **Permission Levels**: Owner, admin, and basic user status levels
- **Built-in Commands**: menu, ping, profile commands included

### User System
- **Auto-registration**: New users are automatically created on first interaction
- **Resource Management**: Users have limits, balance, and chips for various bot features
- **Status Hierarchy**: Owner > Admin > Basic user permissions
- **Activity Tracking**: Last activity and membership duration tracking

## Data Flow

1. **Message Reception**: WhatsApp messages received through Baileys connection
2. **Command Parsing**: Message text parsed for command prefix and arguments
3. **User Authentication**: User retrieved/created from database with permission validation
4. **Rate Limiting**: Command limit requirements checked against user resources
5. **Command Execution**: Appropriate command handler invoked with validated parameters
6. **Response Generation**: Bot sends formatted response back to WhatsApp
7. **State Updates**: User limits and activity updated in database

## External Dependencies

### Core Dependencies
- **@whiskeysockets/baileys**: WhatsApp Web API integration
- **mongoose**: MongoDB object modeling
- **qrcode-terminal**: QR code display for WhatsApp authentication
- **@hapi/boom**: Error handling utilities

### Database Schema
- **Users Collection**: Stores user data including permissions, resources, and activity
- **Authentication State**: File-based WhatsApp session persistence

## Deployment Strategy

### Multi-Platform Support
- **Replit**: Native support with workflow configuration and port binding
- **Railway**: Full Docker containerization with automated deployment
- **Docker**: Standalone container deployment with health checks
- **Local Development**: Docker Compose with optional MongoDB service

### Environment Configuration
- **MongoDB URI**: Configurable through environment variables with fallback
- **Owner Number**: Hardcoded in config for initial setup
- **Default Settings**: Centralized configuration for user defaults and bot behavior
- **Production Variables**: Comprehensive .env.example template provided

### Connection Management
- **Auto-reconnection**: Handles WhatsApp disconnections with automatic retry
- **Database Pooling**: MongoDB connection pooling for performance
- **Error Recovery**: Graceful handling of database and WhatsApp connection errors
- **Health Monitoring**: API endpoints for status checking and monitoring

### Scalability Considerations
- **Modular Commands**: Easy to add new commands without core changes
- **Database Indexing**: User ID indexing for fast lookups
- **Resource Limits**: Built-in rate limiting prevents abuse
- **Session Persistence**: WhatsApp authentication state preserved across restarts

### Security Features
- **Permission System**: Multi-level user access control
- **Rate Limiting**: Command usage limits prevent spam
- **Input Validation**: Command parsing and argument validation
- **Error Sanitization**: Safe error messages without exposing internals