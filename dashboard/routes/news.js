const { requireAuth } = require('../middleware');
const { getBaseTemplate } = require('../templates');

function setupNewsRoutes(app) {
    // News page
    app.get('/news', requireAuth, async (req, res) => {
        try {
            const content = `
                <div class="news-section">
                    <div class="card">
                        <h1>📰 Latest News</h1>
                        <p>Stay updated with the latest news and announcements from NoMercy bot.</p>
                    </div>
                    
                    <div class="news-grid" id="news-grid">
                        <div class="loading">Loading news...</div>
                    </div>
                </div>
                
                <style>
                    .news-section {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    .news-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        gap: 2rem;
                        margin-top: 2rem;
                    }
                    
                    .news-item {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        padding: 2rem;
                        transition: all 0.3s ease;
                    }
                    
                    .news-item:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                        border-color: #6366f1;
                    }
                    
                    .news-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                        flex-wrap: wrap;
                        gap: 1rem;
                    }
                    
                    .news-title {
                        color: #6366f1;
                        font-size: 1.3rem;
                        font-weight: 600;
                        margin: 0;
                    }
                    
                    .news-date {
                        color: #999999;
                        font-size: 0.9rem;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 0.3rem 0.8rem;
                        border-radius: 20px;
                    }
                    
                    .news-content {
                        color: #cccccc;
                        line-height: 1.6;
                        margin-bottom: 1rem;
                    }
                    
                    .news-author {
                        color: #999999;
                        font-size: 0.85rem;
                        font-style: italic;
                        margin-top: 1rem;
                        padding-top: 1rem;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .loading {
                        text-align: center;
                        padding: 3rem;
                        color: #cccccc;
                        font-size: 1.1rem;
                    }
                    
                    .no-news {
                        text-align: center;
                        padding: 3rem;
                        color: #cccccc;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                    }
                    
                    .no-news h3 {
                        color: #6366f1;
                        margin-bottom: 1rem;
                    }
                    
                    @media (max-width: 768px) {
                        .news-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        .news-header {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        
                        .news-item {
                            padding: 1.5rem;
                        }
                    }
                </style>
                
                <script>
                    // Load news from API
                    async function loadNews() {
                        try {
                            const response = await fetch('/api/news');
                            const result = await response.json();
                            
                            const newsGrid = document.getElementById('news-grid');
                            
                            if (result.success && result.news && result.news.length > 0) {
                                newsGrid.innerHTML = result.news.map(news => 
                                    '<div class="card news-item">' +
                                    '<div class="news-header">' +
                                    '<h3 class="news-title">' + news.title + '</h3>' +
                                    '<span class="news-date">' + new Date(news.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    }) + '</span>' +
                                    '</div>' +
                                    '<div class="news-content">' + news.content.replace(/\\n/g, '<br>') + '</div>' +
                                    '<div class="news-author">By: ' + news.author + '</div>' +
                                    '</div>'
                                ).join('');
                            } else {
                                newsGrid.innerHTML = 
                                    '<div class="no-news">' +
                                    '<h3>📰 No News Available</h3>' +
                                    '<p>There are no active news announcements at the moment.</p>' +
                                    '<p>Check back later for updates!</p>' +
                                    '</div>';
                            }
                        } catch (error) {
                            console.error('Error loading news:', error);
                            document.getElementById('news-grid').innerHTML = 
                                '<div class="no-news">' +
                                '<h3>❌ Error Loading News</h3>' +
                                '<p>Unable to load news at the moment.</p>' +
                                '<p>Please try again later.</p>' +
                                '</div>';
                        }
                    }
                    
                    // Load news when page loads
                    document.addEventListener('DOMContentLoaded', loadNews);
                </script>
            `;
            
            res.send(getBaseTemplate('News', content, 'news'));
        } catch (error) {
            console.error('Error loading news page:', error);
            res.status(500).send('Internal Server Error');
        }
    });
}

module.exports = { setupNewsRoutes };