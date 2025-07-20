const express = require('express');
const config = require('./config/config');
const { setupProfileRoutes } = require('./profile-system');
const { getNavigationTemplate } = require('./navigation-system');

function setupDashboardRoutes(app, qrFunctions) {
    // Middleware to check authentication
    function requireAuth(req, res, next) {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        next();
    }

    // Middleware to check owner role
    function requireOwner(req, res, next) {
        if (!req.session.user || req.session.user.role !== 'owner') {
            return res.status(403).send('Access denied. Owner role required.');
        }
        next();
    }

    // Note: Root route '/' is handled by web-server.js

    // Navigation template function is now imported from navigation-system.js
    
    // Base page template
    function getBaseTemplate(title, content, activePage = '') {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>NoMercy - ${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%);
            min-height: 100vh;
            color: #ffffff;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .card {
            background: rgba(30, 30, 30, 0.95);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .btn {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            font-weight: 600;
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 20px rgba(255, 255, 255, 0.1);
        }
        h1, h2, h3 {
            color: #ffffff;
            margin-bottom: 1rem;
        }
        p {
            color: #cccccc;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            .card {
                padding: 1.5rem;
            }
        }
    </style>
    ${getNavigationTemplate(activePage)}
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>
        `;
    }