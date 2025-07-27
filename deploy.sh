#!/bin/bash

# Seana Bot Deployment Script for Railway
# This script helps deploy the bot to Railway platform

echo "🚀 Seana Bot Railway Deployment Script"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "📥 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔑 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Initialize Railway project (if not already initialized)
if [ ! -f "railway.toml" ] && [ ! -f ".railway" ]; then
    echo "🎯 Initializing Railway project..."
    railway init
fi

# Check environment variables
echo "🔧 Checking required environment variables..."

REQUIRED_VARS=("MONGODB_URI" "NODE_ENV" "PORT")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! railway variables get $var &> /dev/null; then
        MISSING_VARS+=($var)
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "⚠️  Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please set them using:"
    echo "railway variables set VARIABLE_NAME=value"
    echo ""
    read -p "Do you want to set them now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for var in "${MISSING_VARS[@]}"; do
            read -p "Enter value for $var: " value
            railway variables set $var="$value"
        done
    else
        echo "❌ Deployment cancelled. Please set required variables first."
        exit 1
    fi
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Check deployment status
echo "✅ Deployment initiated!"
echo ""
echo "🔗 You can check the deployment status at:"
echo "   https://railway.app/dashboard"
echo ""
echo "📱 Once deployed, you can access your bot at the Railway provided URL"
echo "🔧 Monitor logs using: railway logs"
echo ""
echo "🎉 Deployment complete!"