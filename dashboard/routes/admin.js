const { requireAuth, requireOwner } = require('../middleware');
const { getBaseTemplate } = require('../templates');

function setupAdminRoutes(app) {
    // Admin dashboard
    app.get('/admin', requireAuth, requireOwner, async (req, res) => {
        try {
            const content = `
                <div class="admin-section">
                    <div class="card">
                        <h1>🛠️ Admin Dashboard</h1>
                        <p>Manage bot features and system settings.</p>
                    </div>
                    
                    <div class="admin-grid">
                        <div class="card admin-card">
                            <h3>📢 News Management</h3>
                            <p>Create and manage news announcements.</p>
                            <a href="/admin/news" class="btn">Manage News</a>
                        </div>
                        
                        <div class="card admin-card">
                            <h3>👥 User Management</h3>
                            <p>Manage user accounts and permissions.</p>
                            <a href="/admin/users" class="btn">Manage Users</a>
                        </div>
                        
                        <div class="card admin-card">
                            <h3>🎮 Game Management</h3>
                            <p>Configure games and rewards.</p>
                            <a href="/admin/games" class="btn">Manage Games</a>
                        </div>
                        
                        <div class="card admin-card">
                            <h3>🗓️ Daily Login Rewards</h3>
                            <p>Manage daily login rewards for all 7 days.</p>
                            <a href="/admin/daily-login" class="btn">Manage Daily Rewards</a>
                        </div>
                        
                        <div class="card admin-card">
                            <h3>⚙️ Bot Settings</h3>
                            <p>Configure bot behavior and features.</p>
                            <a href="/admin/settings" class="btn">Bot Settings</a>
                        </div>
                        
                        <div class="card admin-card">
                            <h3>📊 Statistics</h3>
                            <p>View bot usage and performance stats.</p>
                            <a href="/admin/stats" class="btn">View Stats</a>
                        </div>
                        
                        <div class="card admin-card">
                            <h3>🔧 System Tools</h3>
                            <p>Database management and system tools.</p>
                            <a href="/admin/tools" class="btn">System Tools</a>
                        </div>
                    </div>
                </div>
                
                <style>
                    .admin-section {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    .admin-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 2rem;
                        margin-top: 2rem;
                    }
                    
                    .admin-card {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        padding: 2rem;
                        text-align: center;
                        transition: all 0.3s ease;
                    }
                    
                    .admin-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                        border-color: #6366f1;
                    }
                    
                    .admin-card h3 {
                        color: #6366f1;
                        margin-bottom: 1rem;
                        font-size: 1.3rem;
                    }
                    
                    .admin-card p {
                        color: #cccccc;
                        margin-bottom: 1.5rem;
                        line-height: 1.5;
                    }
                    
                    .admin-card .btn {
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        border: none;
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        display: inline-block;
                    }
                    
                    .admin-card .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
                    }
                    
                    @media (max-width: 768px) {
                        .admin-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            `;
            
            res.send(getBaseTemplate('Admin Dashboard', content, 'admin'));
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // News management
    app.get('/admin/news', requireAuth, requireOwner, async (req, res) => {
        try {
            const content = `
                <div class="admin-section">
                    <div class="card">
                        <h1>📢 News Management</h1>
                        <p>Create and manage news announcements.</p>
                    </div>
                    
                    <div class="news-actions">
                        <button class="btn btn-primary" onclick="showCreateNewsForm()">Create New News</button>
                        <button class="btn btn-secondary" onclick="loadNewsList()">Refresh List</button>
                        <button class="btn btn-danger" onclick="deleteAllNews()">Delete All News</button>
                    </div>
                    
                    <!-- Create News Form -->
                    <div id="create-news-form" class="card" style="display: none;">
                        <h3>📝 Create New News</h3>
                        <form id="news-form">
                            <div class="form-group">
                                <label for="news-title">Title</label>
                                <input type="text" id="news-title" name="title" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="news-content">Content</label>
                                <textarea id="news-content" name="content" rows="6" required></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="news-category">Category</label>
                                <select id="news-category" name="category" required>
                                    <option value="">Select Category</option>
                                    <option value="Pengumuman">📢 Pengumuman</option>
                                    <option value="Update">🔄 Update</option>
                                    <option value="Penting">⚠️ Penting</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="news-status">Status</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="news-status" name="status" checked>
                                    <label for="news-status" class="toggle-label">
                                        <span class="toggle-switch"></span>
                                        <span class="toggle-text">Active</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Create News</button>
                                <button type="button" class="btn btn-secondary" onclick="hideCreateNewsForm()">Cancel</button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Edit News Form -->
                    <div id="edit-news-form" class="card" style="display: none;">
                        <h3>✏️ Edit News</h3>
                        <form id="edit-news-form-element">
                            <input type="hidden" id="edit-news-id" name="id">
                            
                            <div class="form-group">
                                <label for="edit-news-title">Title</label>
                                <input type="text" id="edit-news-title" name="title" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-news-content">Content</label>
                                <textarea id="edit-news-content" name="content" rows="6" required></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-news-category">Category</label>
                                <select id="edit-news-category" name="category" required>
                                    <option value="">Select Category</option>
                                    <option value="Pengumuman">📢 Pengumuman</option>
                                    <option value="Update">🔄 Update</option>
                                    <option value="Penting">⚠️ Penting</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-news-status">Status</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="edit-news-status" name="status">
                                    <label for="edit-news-status" class="toggle-label">
                                        <span class="toggle-switch"></span>
                                        <span class="toggle-text">Active</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Update News</button>
                                <button type="button" class="btn btn-secondary" onclick="hideEditNewsForm()">Cancel</button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- News List -->
                    <div class="card">
                        <h3>📋 News List</h3>
                        <div id="news-list">
                            <div class="loading">Loading news...</div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .admin-section {
                        max-width: 1000px;
                        margin: 0 auto;
                    }
                    
                    .news-actions {
                        display: flex;
                        gap: 1rem;
                        margin: 2rem 0;
                        flex-wrap: wrap;
                    }
                    
                    .form-group {
                        margin-bottom: 1.5rem;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        color: #ffffff;
                        font-weight: 600;
                    }
                    
                    .form-group input,
                    .form-group textarea,
                    .form-group select {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.05);
                        color: #ffffff;
                        font-size: 1rem;
                    }
                    
                    .form-group input:focus,
                    .form-group textarea:focus,
                    .form-group select:focus {
                        outline: none;
                        border-color: #6366f1;
                        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                    }
                    
                    .form-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                    }
                    
                    .news-item {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        padding: 1.5rem;
                        margin-bottom: 1rem;
                    }
                    
                    .news-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                    }
                    
                    .news-title {
                        font-size: 1.2rem;
                        font-weight: 600;
                        color: #ffffff;
                    }
                    
                    .news-status {
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    
                    .news-status.active {
                        background: #10b981;
                        color: #ffffff;
                    }
                    
                    .news-status.inactive {
                        background: #6b7280;
                        color: #ffffff;
                    }
                    
                    .news-content {
                        color: #cccccc;
                        line-height: 1.6;
                        margin-bottom: 1rem;
                    }
                    
                    .news-actions-item {
                        display: flex;
                        gap: 0.5rem;
                        align-items: center;
                    }
                    
                    .news-date {
                        color: #999999;
                        font-size: 0.9rem;
                    }
                    
                    .loading {
                        text-align: center;
                        padding: 2rem;
                        color: #cccccc;
                    }
                    
                    .btn-sm {
                        padding: 0.4rem 0.8rem;
                        font-size: 0.85rem;
                    }
                    
                    .btn-danger {
                        background: #ef4444;
                        color: white;
                    }
                    
                    .btn-danger:hover {
                        background: #dc2626;
                    }
                    
                    .btn-warning {
                        background: #f59e0b;
                        color: white;
                    }
                    
                    .btn-warning:hover {
                        background: #d97706;
                    }
                    
                    .toggle-container {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .toggle-label {
                        position: relative;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        cursor: pointer;
                        color: #ffffff;
                        font-weight: 600;
                    }
                    
                    .toggle-switch {
                        width: 50px;
                        height: 24px;
                        background: #374151;
                        border-radius: 12px;
                        position: relative;
                        transition: background 0.3s ease;
                    }
                    
                    .toggle-switch::before {
                        content: '';
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        background: white;
                        border-radius: 50%;
                        top: 2px;
                        left: 2px;
                        transition: transform 0.3s ease;
                    }
                    
                    input[type="checkbox"] {
                        display: none;
                    }
                    
                    input[type="checkbox"]:checked + .toggle-label .toggle-switch {
                        background: #10b981;
                    }
                    
                    input[type="checkbox"]:checked + .toggle-label .toggle-switch::before {
                        transform: translateX(26px);
                    }
                    
                    .news-category {
                        display: inline-block;
                        padding: 0.25rem 0.75rem;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        margin-right: 0.5rem;
                    }
                    
                    .news-category.Pengumuman {
                        background: #3b82f6;
                        color: white;
                    }
                    
                    .news-category.Update {
                        background: #10b981;
                        color: white;
                    }
                    
                    .news-category.Penting {
                        background: #ef4444;
                        color: white;
                    }
                    
                    @media (max-width: 768px) {
                        .news-header {
                            flex-direction: column;
                            gap: 1rem;
                            align-items: flex-start;
                        }
                        
                        .news-actions-item {
                            flex-wrap: wrap;
                        }
                        
                        .form-actions {
                            flex-direction: column;
                        }
                    }
                </style>
                
                <script>
                    // Show create news form
                    function showCreateNewsForm() {
                        document.getElementById('create-news-form').style.display = 'block';
                        document.getElementById('news-title').focus();
                    }
                    
                    // Hide create news form
                    function hideCreateNewsForm() {
                        document.getElementById('create-news-form').style.display = 'none';
                        document.getElementById('news-form').reset();
                    }
                    
                    // Show edit news form
                    function showEditNewsForm(newsId, title, content, category, status) {
                        document.getElementById('edit-news-form').style.display = 'block';
                        document.getElementById('edit-news-id').value = newsId;
                        document.getElementById('edit-news-title').value = title;
                        document.getElementById('edit-news-content').value = content;
                        document.getElementById('edit-news-category').value = category;
                        document.getElementById('edit-news-status').checked = status === 'active';
                        updateToggleText('edit-news-status', status === 'active');
                        document.getElementById('edit-news-title').focus();
                    }
                    
                    // Hide edit news form
                    function hideEditNewsForm() {
                        document.getElementById('edit-news-form').style.display = 'none';
                        document.getElementById('edit-news-form-element').reset();
                    }
                    
                    // Update toggle text
                    function updateToggleText(toggleId, isChecked) {
                        const toggleText = document.querySelector('#' + toggleId + ' + .toggle-label .toggle-text');
                        if (toggleText) {
                            toggleText.textContent = isChecked ? 'Active' : 'Inactive';
                        }
                    }
                    
                    // Create news
                    document.getElementById('news-form').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const formData = new FormData(this);
                        const newsData = {
                            title: formData.get('title'),
                            content: formData.get('content'),
                            category: formData.get('category'),
                            status: formData.get('status') ? 'active' : 'inactive'
                        };
                        
                        try {
                            const response = await fetch('/api/admin/news', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(newsData)
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                alert('News created successfully!');
                                hideCreateNewsForm();
                                loadNewsList();
                            } else {
                                alert('Error creating news: ' + result.message);
                            }
                        } catch (error) {
                            console.error('Error creating news:', error);
                            alert('Error creating news');
                        }
                    });
                    
                    // Load news list
                    async function loadNewsList() {
                        try {
                            const response = await fetch('/api/admin/news');
                            const result = await response.json();
                            
                            if (result.success) {
                                const newsList = document.getElementById('news-list');
                                
                                if (result.news && result.news.length > 0) {
                                    newsList.innerHTML = result.news.map(news => 
                                        '<div class="news-item">' +
                                        '<div class="news-header">' +
                                        '<div class="news-title">' + news.title + '</div>' +
                                        '<div>' +
                                        '<span class="news-category ' + news.category + '">' + getCategoryIcon(news.category) + ' ' + news.category + '</span>' +
                                        '<span class="news-status ' + news.status + '">' + news.status + '</span>' +
                                        '</div>' +
                                        '</div>' +
                                        '<div class="news-content">' + news.content + '</div>' +
                                        '<div class="news-actions-item">' +
                                        '<button class="btn btn-sm btn-warning" onclick="editNews(\\'' + news._id + '\\', \\'' + news.title.replace(/'/g, "\\'") + '\\', \\'' + news.content.replace(/'/g, "\\'") + '\\', \\'' + news.category + '\\', \\'' + news.status + '\\')">Edit</button>' +
                                        '<button class="btn btn-sm btn-danger" onclick="deleteNews(\\'' + news._id + '\\')">Delete</button>' +
                                        '<div class="news-date">' + new Date(news.createdAt).toLocaleDateString() + '</div>' +
                                        '</div>' +
                                        '</div>'
                                    ).join('');
                                } else {
                                    newsList.innerHTML = '<div class="loading">No news found</div>';
                                }
                            } else {
                                document.getElementById('news-list').innerHTML = '<div class="loading">Error loading news</div>';
                            }
                        } catch (error) {
                            console.error('Error loading news:', error);
                            document.getElementById('news-list').innerHTML = '<div class="loading">Error loading news</div>';
                        }
                    }
                    
                    // Delete news
                    async function deleteNews(newsId) {
                        if (!confirm('Are you sure you want to delete this news?')) {
                            return;
                        }
                        
                        try {
                            const response = await fetch('/api/admin/news/' + newsId, {
                                method: 'DELETE'
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                alert('News deleted successfully!');
                                loadNewsList();
                            } else {
                                alert('Error deleting news: ' + result.message);
                            }
                        } catch (error) {
                            console.error('Error deleting news:', error);
                            alert('Error deleting news');
                        }
                    }
                    
                    // Edit news
                    function editNews(newsId, title, content, category, status) {
                        showEditNewsForm(newsId, title, content, category, status);
                    }
                    
                    // Get category icon
                    function getCategoryIcon(category) {
                        switch(category) {
                            case 'Pengumuman': return '📢';
                            case 'Update': return '🔄';
                            case 'Penting': return '⚠️';
                            default: return '📝';
                        }
                    }
                    
                    // Delete all news
                    async function deleteAllNews() {
                        if (!confirm('Are you sure you want to delete ALL news? This action cannot be undone!')) {
                            return;
                        }
                        
                        try {
                            const response = await fetch('/api/admin/news/all', {
                                method: 'DELETE'
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                alert('All news deleted successfully!');
                                loadNewsList();
                            } else {
                                alert('Error deleting all news: ' + result.message);
                            }
                        } catch (error) {
                            console.error('Error deleting all news:', error);
                            alert('Error deleting all news');
                        }
                    }
                    
                    // Edit news form submission
                    document.getElementById('edit-news-form-element').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const formData = new FormData(this);
                        const newsId = formData.get('id');
                        const newsData = {
                            title: formData.get('title'),
                            content: formData.get('content'),
                            category: formData.get('category'),
                            status: formData.get('status') ? 'active' : 'inactive'
                        };
                        
                        try {
                            const response = await fetch('/api/admin/news/' + newsId, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(newsData)
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                alert('News updated successfully!');
                                hideEditNewsForm();
                                loadNewsList();
                            } else {
                                alert('Error updating news: ' + result.message);
                            }
                        } catch (error) {
                            console.error('Error updating news:', error);
                            alert('Error updating news');
                        }
                    });
                    
                    // Toggle status change handlers
                    document.getElementById('news-status').addEventListener('change', function() {
                        updateToggleText('news-status', this.checked);
                    });
                    
                    document.getElementById('edit-news-status').addEventListener('change', function() {
                        updateToggleText('edit-news-status', this.checked);
                    });
                    
                    // Load news list when page loads
                    document.addEventListener('DOMContentLoaded', loadNewsList);
                </script>
            `;
            
            res.send(getBaseTemplate('News Management', content, 'admin'));
        } catch (error) {
            console.error('Error loading admin news page:', error);
            res.status(500).send('Internal Server Error');
        }
    });
}

module.exports = { setupAdminRoutes };