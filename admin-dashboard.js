
const express = require('express');
const { getNavigationTemplate } = require('./navigation-system');

function setupAdminDashboardRoutes(app) {
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

    // Base template for admin pages
    function getAdminBaseTemplate(title, content, activePage = '') {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard - ${title}</title>
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
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        .admin-header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 1rem 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .admin-header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .admin-header p {
            opacity: 0.9;
        }
        .card {
            background: rgba(30, 30, 30, 0.95);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .admin-nav {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        .admin-nav-item {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            text-decoration: none;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .admin-nav-item:hover, .admin-nav-item.active {
            background: rgba(99, 102, 241, 0.2);
            border-color: #6366f1;
            color: #6366f1;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: rgba(40, 40, 40, 0.9);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: #cccccc;
            font-size: 0.9rem;
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
            margin: 0.25rem;
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }
        .btn-danger {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }
        .btn-danger:hover {
            box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
        }
        .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .btn-success:hover {
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .table th {
            background: rgba(40, 40, 40, 0.8);
            font-weight: 600;
        }
        .table tr:hover {
            background: rgba(255, 255, 255, 0.05);
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(40, 40, 40, 0.8);
            color: #ffffff;
            font-size: 1rem;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none;
            border-color: #6366f1;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        .alert-success {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
        }
        .alert-danger {
            background: rgba(220, 38, 38, 0.2);
            border: 1px solid rgba(220, 38, 38, 0.3);
            color: #dc2626;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
        }
        .modal-content {
            background: rgba(30, 30, 30, 0.95);
            margin: 5% auto;
            padding: 2rem;
            border-radius: 15px;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .close {
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            color: #cccccc;
        }
        .close:hover {
            color: #ffffff;
        }
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .admin-nav { flex-direction: column; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
    ${getNavigationTemplate(activePage)}
</head>
<body>
    <div class="container">
        <div class="admin-header">
            <h1>🔧 Admin Dashboard</h1>
            <p>Comprehensive bot management and administration panel</p>
        </div>
        
        <nav class="admin-nav">
            <a href="/admin/dashboard" class="admin-nav-item ${activePage === 'dashboard' ? 'active' : ''}">📊 Overview</a>
            <a href="/admin/users" class="admin-nav-item ${activePage === 'users' ? 'active' : ''}">👥 Users</a>
            <a href="/admin/groups" class="admin-nav-item ${activePage === 'groups' ? 'active' : ''}">💬 Groups</a>
            <a href="/admin/news" class="admin-nav-item ${activePage === 'news' ? 'active' : ''}">📰 News</a>
            <a href="/admin/settings" class="admin-nav-item ${activePage === 'settings' ? 'active' : ''}">⚙️ Settings</a>
            <a href="/admin/logs" class="admin-nav-item ${activePage === 'logs' ? 'active' : ''}">📝 Logs</a>
            <a href="/admin/broadcast" class="admin-nav-item ${activePage === 'broadcast' ? 'active' : ''}">📢 Broadcast</a>
        </nav>
        
        ${content}
    </div>
</body>
</html>
        `;
    }

    // Main admin dashboard
    app.get('/admin/dashboard', requireOwner, async (req, res) => {
        try {
            const { User } = require('./lib/database');
            
            // Get statistics
            const totalUsers = await User.countDocuments();
            const premiumUsers = await User.countDocuments({ status: 'premium' });
            const totalBalance = await User.aggregate([
                { $group: { _id: null, total: { $sum: '$balance' } } }
            ]);
            const totalChips = await User.aggregate([
                { $group: { _id: null, total: { $sum: '$chips' } } }
            ]);

            const content = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" style="color: #10b981;">${totalUsers}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" style="color: #8b5cf6;">${premiumUsers}</div>
                        <div class="stat-label">Premium Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" style="color: #f59e0b;">${totalBalance[0]?.total || 0}</div>
                        <div class="stat-label">Total Balance</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" style="color: #ef4444;">${totalChips[0]?.total || 0}</div>
                        <div class="stat-label">Total Chips</div>
                    </div>
                </div>

                <div class="grid">
                    <div class="card">
                        <h3>🤖 Bot Status</h3>
                        <p><strong>Status:</strong> <span style="color: #10b981;">Online</span></p>
                        <p><strong>Uptime:</strong> <span id="uptime">Loading...</span></p>
                        <p><strong>Memory Usage:</strong> <span id="memory">Loading...</span></p>
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-success" onclick="restartBot()">Restart Bot</button>
                            <button class="btn btn-danger" onclick="shutdownBot()">Shutdown</button>
                        </div>
                    </div>

                    <div class="card">
                        <h3>📊 Recent Activity</h3>
                        <div id="recent-activity">Loading...</div>
                    </div>

                    <div class="card">
                        <h3>⚠️ System Alerts</h3>
                        <div class="alert alert-success">Bot is running normally</div>
                        <div class="alert alert-danger" style="display: none;">Database connection issues detected</div>
                    </div>

                    <div class="card">
                        <h3>🔧 Quick Actions</h3>
                        <button class="btn" onclick="showBroadcastModal()">📢 Send Broadcast</button>
                        <button class="btn" onclick="showAddUserModal()">👤 Add User</button>
                        <button class="btn" onclick="clearCache()">🗑️ Clear Cache</button>
                        <button class="btn" onclick="backupDatabase()">💾 Backup DB</button>
                    </div>
                </div>

                <!-- Broadcast Modal -->
                <div id="broadcastModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeBroadcastModal()">&times;</span>
                        <h3>📢 Send Broadcast Message</h3>
                        <form id="broadcastForm">
                            <div class="form-group">
                                <label>Message:</label>
                                <textarea id="broadcastMessage" rows="4" placeholder="Enter your broadcast message..."></textarea>
                            </div>
                            <div class="form-group">
                                <label>Target:</label>
                                <select id="broadcastTarget">
                                    <option value="all">All Users</option>
                                    <option value="premium">Premium Users Only</option>
                                    <option value="groups">All Groups</option>
                                </select>
                            </div>
                            <button type="submit" class="btn">Send Broadcast</button>
                        </form>
                    </div>
                </div>

                <script>
                    function showBroadcastModal() {
                        document.getElementById('broadcastModal').style.display = 'block';
                    }
                    
                    function closeBroadcastModal() {
                        document.getElementById('broadcastModal').style.display = 'none';
                    }

                    document.getElementById('broadcastForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const message = document.getElementById('broadcastMessage').value;
                        const target = document.getElementById('broadcastTarget').value;
                        
                        if (!message.trim()) {
                            alert('Please enter a message');
                            return;
                        }

                        try {
                            const response = await fetch('/admin/api/broadcast', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message, target })
                            });
                            
                            const result = await response.json();
                            if (result.success) {
                                alert('Broadcast sent successfully!');
                                closeBroadcastModal();
                                document.getElementById('broadcastMessage').value = '';
                            } else {
                                alert('Failed to send broadcast: ' + result.message);
                            }
                        } catch (error) {
                            alert('Error sending broadcast');
                        }
                    });

                    function restartBot() {
                        if (confirm('Are you sure you want to restart the bot?')) {
                            fetch('/admin/api/restart', { method: 'POST' })
                                .then(response => response.json())
                                .then(data => alert(data.message));
                        }
                    }

                    function clearCache() {
                        fetch('/admin/api/clear-cache', { method: 'POST' })
                            .then(response => response.json())
                            .then(data => alert(data.message));
                    }

                    function backupDatabase() {
                        fetch('/admin/api/backup-db', { method: 'POST' })
                            .then(response => response.json())
                            .then(data => alert(data.message));
                    }

                    // Update system info
                    function updateSystemInfo() {
                        fetch('/admin/api/system-info')
                            .then(response => response.json())
                            .then(data => {
                                document.getElementById('uptime').textContent = data.uptime;
                                document.getElementById('memory').textContent = data.memory;
                            });
                    }

                    setInterval(updateSystemInfo, 30000);
                    updateSystemInfo();
                </script>
            `;
            
            res.send(getAdminBaseTemplate('Dashboard', content, 'dashboard'));
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
            res.send(getAdminBaseTemplate('Dashboard', '<div class="card"><h3>Error loading dashboard</h3></div>', 'dashboard'));
        }
    });

    // Users management
    app.get('/admin/users', requireOwner, async (req, res) => {
        try {
            const { User } = require('./lib/database');
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const skip = (page - 1) * limit;

            const users = await User.find()
                .sort({ memberSince: -1 })
                .skip(skip)
                .limit(limit);

            const totalUsers = await User.countDocuments();
            const totalPages = Math.ceil(totalUsers / limit);

            const userRows = users.map(user => `
                <tr>
                    <td>${user.name || user.jid}</td>
                    <td>${user.jid}</td>
                    <td><span style="color: ${getStatusColor(user.status)}">${user.status}</span></td>
                    <td>${user.balance || 0}</td>
                    <td>${user.chips || 0}</td>
                    <td>${user.limit === 'unlimited' ? '∞' : (user.limit || 0)}</td>
                    <td>
                        <button class="btn" onclick="editUser('${user._id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');

            const content = `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2>👥 User Management</h2>
                        <button class="btn" onclick="showAddUserModal()">Add New User</button>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>WhatsApp ID</th>
                                <th>Status</th>
                                <th>Balance</th>
                                <th>Chips</th>
                                <th>Limit</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userRows}
                        </tbody>
                    </table>

                    <div style="text-align: center; margin-top: 2rem;">
                        ${page > 1 ? `<a href="/admin/users?page=${page - 1}" class="btn">Previous</a>` : ''}
                        <span style="margin: 0 1rem;">Page ${page} of ${totalPages}</span>
                        ${page < totalPages ? `<a href="/admin/users?page=${page + 1}" class="btn">Next</a>` : ''}
                    </div>
                </div>

                <script>
                    function editUser(userId) {
                        window.location.href = '/admin/users/edit/' + userId;
                    }

                    function deleteUser(userId) {
                        if (confirm('Are you sure you want to delete this user?')) {
                            fetch('/admin/api/users/' + userId, { method: 'DELETE' })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        location.reload();
                                    } else {
                                        alert('Failed to delete user');
                                    }
                                });
                        }
                    }
                </script>
            `;

            res.send(getAdminBaseTemplate('Users', content, 'users'));
        } catch (error) {
            console.error('Error loading users:', error);
            res.send(getAdminBaseTemplate('Users', '<div class="card"><h3>Error loading users</h3></div>', 'users'));
        }
    });

    // News management page
    app.get('/admin/news', requireOwner, async (req, res) => {
        try {
            let news = [];
            try {
                const { News } = require('./lib/newsModel');
                news = await News.find().sort({ createdAt: -1 });
            } catch (modelError) {
                console.log('News model not found or error:', modelError.message);
                news = [];
            }

            const newsRows = news.map(item => `
                <tr>
                    <td><strong>${item.title}</strong></td>
                    <td><span class="badge badge-${getCategoryColor(item.category)}">${item.category}</span></td>
                    <td>${item.priority}</td>
                    <td><span style="color: ${item.isActive ? '#10b981' : '#ef4444'}">${item.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>${item.createdAt.toLocaleDateString()}</td>
                    <td>
                        <button class="btn" onclick="editNews('${item._id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteNews('${item._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');

            const content = `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2>📰 News Management</h2>
                        <button class="btn" onclick="showAddNewsModal()">Add New News</button>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${newsRows || '<tr><td colspan="6" style="text-align: center;">No news found</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <!-- Add News Modal -->
                <div id="addNewsModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeAddNewsModal()">&times;</span>
                        <h3>📰 Add New News</h3>
                        <form id="addNewsForm">
                            <div class="form-group">
                                <label>Title:</label>
                                <input type="text" id="newsTitle" placeholder="Enter news title..." required>
                            </div>
                            <div class="form-group">
                                <label>Content:</label>
                                <textarea id="newsContent" rows="6" placeholder="Enter news content..." required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Category:</label>
                                <select id="newsCategory" required>
                                    <option value="announcement">Announcement</option>
                                    <option value="hot">Hot News</option>
                                    <option value="event">Event</option>
                                    <option value="update">Update</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Priority:</label>
                                <input type="number" id="newsPriority" min="0" max="10" value="0" placeholder="0-10">
                            </div>
                            <div class="form-group">
                                <label>Status:</label>
                                <select id="newsStatus">
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Author:</label>
                                <input type="text" id="newsAuthor" value="${req.session.user?.name || 'Admin'}" required>
                            </div>
                            <button type="submit" class="btn">Add News</button>
                        </form>
                    </div>
                </div>

                <!-- Edit News Modal -->
                <div id="editNewsModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeEditNewsModal()">&times;</span>
                        <h3>📝 Edit News</h3>
                        <form id="editNewsForm">
                            <input type="hidden" id="editNewsId">
                            <div class="form-group">
                                <label>Title:</label>
                                <input type="text" id="editNewsTitle" required>
                            </div>
                            <div class="form-group">
                                <label>Content:</label>
                                <textarea id="editNewsContent" rows="6" required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Category:</label>
                                <select id="editNewsCategory" required>
                                    <option value="announcement">Announcement</option>
                                    <option value="hot">Hot News</option>
                                    <option value="event">Event</option>
                                    <option value="update">Update</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Priority:</label>
                                <input type="number" id="editNewsPriority" min="0" max="10">
                            </div>
                            <div class="form-group">
                                <label>Status:</label>
                                <select id="editNewsStatus">
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Author:</label>
                                <input type="text" id="editNewsAuthor" required>
                            </div>
                            <button type="submit" class="btn">Update News</button>
                        </form>
                    </div>
                </div>

                <style>
                    .badge {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 0.8em;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .badge-announcement { background: #3b82f6; color: white; }
                    .badge-hot { background: #ef4444; color: white; }
                    .badge-event { background: #10b981; color: white; }
                    .badge-update { background: #8b5cf6; color: white; }
                </style>

                <script>
                    function showAddNewsModal() {
                        document.getElementById('addNewsModal').style.display = 'block';
                    }
                    
                    function closeAddNewsModal() {
                        document.getElementById('addNewsModal').style.display = 'none';
                        document.getElementById('addNewsForm').reset();
                    }

                    function showEditNewsModal() {
                        document.getElementById('editNewsModal').style.display = 'block';
                    }
                    
                    function closeEditNewsModal() {
                        document.getElementById('editNewsModal').style.display = 'none';
                        document.getElementById('editNewsForm').reset();
                    }

                    document.getElementById('addNewsForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const newsData = {
                            title: document.getElementById('newsTitle').value,
                            content: document.getElementById('newsContent').value,
                            category: document.getElementById('newsCategory').value,
                            priority: parseInt(document.getElementById('newsPriority').value),
                            isActive: document.getElementById('newsStatus').value === 'true',
                            author: document.getElementById('newsAuthor').value
                        };
                        
                        try {
                            const response = await fetch('/admin/api/news', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(newsData)
                            });
                            
                            const result = await response.json();
                            if (result.success) {
                                alert('News added successfully!');
                                closeAddNewsModal();
                                location.reload();
                            } else {
                                alert('Failed to add news: ' + result.message);
                            }
                        } catch (error) {
                            alert('Error adding news');
                        }
                    });

                    document.getElementById('editNewsForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const newsId = document.getElementById('editNewsId').value;
                        const newsData = {
                            title: document.getElementById('editNewsTitle').value,
                            content: document.getElementById('editNewsContent').value,
                            category: document.getElementById('editNewsCategory').value,
                            priority: parseInt(document.getElementById('editNewsPriority').value),
                            isActive: document.getElementById('editNewsStatus').value === 'true',
                            author: document.getElementById('editNewsAuthor').value
                        };
                        
                        try {
                            const response = await fetch('/admin/api/news/' + newsId, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(newsData)
                            });
                            
                            const result = await response.json();
                            if (result.success) {
                                alert('News updated successfully!');
                                closeEditNewsModal();
                                location.reload();
                            } else {
                                alert('Failed to update news: ' + result.message);
                            }
                        } catch (error) {
                            alert('Error updating news');
                        }
                    });

                    async function editNews(newsId) {
                        try {
                            const response = await fetch('/admin/api/news/' + newsId);
                            const result = await response.json();
                            
                            if (result.success) {
                                const news = result.news;
                                document.getElementById('editNewsId').value = news._id;
                                document.getElementById('editNewsTitle').value = news.title;
                                document.getElementById('editNewsContent').value = news.content;
                                document.getElementById('editNewsCategory').value = news.category;
                                document.getElementById('editNewsPriority').value = news.priority;
                                document.getElementById('editNewsStatus').value = news.isActive.toString();
                                document.getElementById('editNewsAuthor').value = news.author;
                                showEditNewsModal();
                            } else {
                                alert('Failed to load news data');
                            }
                        } catch (error) {
                            alert('Error loading news data');
                        }
                    }

                    function deleteNews(newsId) {
                        if (confirm('Are you sure you want to delete this news?')) {
                            fetch('/admin/api/news/' + newsId, { method: 'DELETE' })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        alert('News deleted successfully!');
                                        location.reload();
                                    } else {
                                        alert('Failed to delete news');
                                    }
                                })
                                .catch(error => {
                                    alert('Error deleting news');
                                });
                        }
                    }
                </script>
            `;

            res.send(getAdminBaseTemplate('News Management', content, 'news'));
        } catch (error) {
            console.error('Error loading news management:', error);
            res.send(getAdminBaseTemplate('News Management', '<div class="card"><h3>Error loading news</h3></div>', 'news'));
        }
    });

    // Broadcast page
    app.get('/admin/broadcast', requireOwner, (req, res) => {
        const content = `
            <div class="card">
                <h2>📢 Broadcast System</h2>
                <form id="broadcastForm">
                    <div class="form-group">
                        <label>Message Type:</label>
                        <select id="messageType">
                            <option value="text">Text Message</option>
                            <option value="image">Image with Caption</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea id="message" rows="6" placeholder="Enter your broadcast message..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Target Audience:</label>
                        <select id="target">
                            <option value="all">All Users</option>
                            <option value="premium">Premium Users Only</option>
                            <option value="basic">Basic Users Only</option>
                            <option value="groups">All Groups</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Schedule (Optional):</label>
                        <input type="datetime-local" id="schedule">
                    </div>
                    <button type="submit" class="btn">Send Broadcast</button>
                    <button type="button" class="btn" onclick="previewBroadcast()">Preview</button>
                </form>
            </div>

            <div class="card">
                <h3>📊 Broadcast History</h3>
                <div id="broadcast-history">Loading...</div>
            </div>
        `;

        res.send(getAdminBaseTemplate('Broadcast', content, 'broadcast'));
    });

    // News API endpoints
    app.post('/admin/api/news', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const newsData = req.body;
            
            const news = new News(newsData);
            await news.save();
            
            res.json({ success: true, message: 'News created successfully', news });
        } catch (error) {
            console.error('Error creating news:', error);
            res.json({ success: false, message: error.message });
        }
    });

    app.get('/admin/api/news/:id', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const news = await News.findById(req.params.id);
            
            if (!news) {
                return res.json({ success: false, message: 'News not found' });
            }
            
            res.json({ success: true, news });
        } catch (error) {
            console.error('Error fetching news:', error);
            res.json({ success: false, message: error.message });
        }
    });

    app.put('/admin/api/news/:id', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const news = await News.findByIdAndUpdate(
                req.params.id, 
                { ...req.body, updatedAt: new Date() }, 
                { new: true }
            );
            
            if (!news) {
                return res.json({ success: false, message: 'News not found' });
            }
            
            res.json({ success: true, message: 'News updated successfully', news });
        } catch (error) {
            console.error('Error updating news:', error);
            res.json({ success: false, message: error.message });
        }
    });

    app.delete('/admin/api/news/:id', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const news = await News.findByIdAndDelete(req.params.id);
            
            if (!news) {
                return res.json({ success: false, message: 'News not found' });
            }
            
            res.json({ success: true, message: 'News deleted successfully' });
        } catch (error) {
            console.error('Error deleting news:', error);
            res.json({ success: false, message: error.message });
        }
    });

    // API endpoints
    app.post('/admin/api/broadcast', requireOwner, async (req, res) => {
        try {
            const { message, target } = req.body;
            // Implement broadcast logic here
            res.json({ success: true, message: 'Broadcast sent successfully' });
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    app.get('/admin/api/system-info', requireOwner, (req, res) => {
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        
        res.json({
            uptime: formatUptime(uptime),
            memory: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`
        });
    });

    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    function getStatusColor(status) {
        const colors = {
            owner: '#ffd700',
            premium: '#8b5cf6',
            admin: '#10b981',
            basic: '#6b7280'
        };
        return colors[status] || colors.basic;
    }

    function getCategoryColor(category) {
        const colors = {
            announcement: 'announcement',
            hot: 'hot',
            event: 'event',
            update: 'update'
        };
        return colors[category] || 'announcement';
    }
}

module.exports = { setupAdminDashboardRoutes };
