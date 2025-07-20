// Navigation System Module
// Contains all navigation templates and functions

function getNavigationTemplate(activePage = '') {
    return `
    <style>
        /* Navigation Styles */
        .nav-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .nav-desktop {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .nav-logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffffff;
            text-decoration: none;
        }
        
        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .nav-links > li {
            position: relative;
        }
        
        .nav-links a,
        .nav-links .nav-dropdown-toggle {
            color: #cccccc;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
            position: relative;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            font-family: inherit;
            padding: 0;
        }
        
        .nav-links a:hover,
        .nav-links a.active,
        .nav-links .nav-dropdown-toggle:hover,
        .nav-links .nav-dropdown-toggle.active {
            color: #6366f1;
        }
        
        .nav-links a.active::after,
        .nav-links .nav-dropdown-toggle.active::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            right: 0;
            height: 2px;
            background: #6366f1;
            border-radius: 1px;
        }
        
        /* Desktop Dropdown */
        .nav-dropdown {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20, 20, 20, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 1.5rem;
            margin-top: 1rem;
            min-width: 600px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .nav-dropdown.show {
            opacity: 1;
            visibility: visible;
        }
        
        .dropdown-content {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
        }
        
        .dropdown-section h4 {
            color: #ffffff;
            margin-bottom: 1rem;
            font-size: 1rem;
            border-bottom: 2px solid rgba(99, 102, 241, 0.3);
            padding-bottom: 0.5rem;
        }
        
        .dropdown-section ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .dropdown-section li {
            margin: 0.5rem 0;
        }
        
        .dropdown-section a {
            color: #cccccc;
            text-decoration: none;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .dropdown-section a:hover {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
        }
        
        /* Currency Display */
        .nav-currency {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .currency-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            padding: 0.5rem 1rem;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        
        .currency-icon {
            font-size: 1rem;
        }
        
        .balance-item .currency-icon {
            color: #10b981;
        }
        
        .chips-item .currency-icon {
            color: #8b5cf6;
        }
        
        /* Mobile Navigation */
        .nav-mobile-top {
            display: none;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
        
        .mobile-brand {
            font-size: 1.3rem;
            font-weight: 700;
            color: #ffffff;
            text-decoration: none;
        }
        
        .mobile-currency {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }
        
        .mobile-currency-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .nav-mobile {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(20, 20, 20, 0.98);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem;
            z-index: 1000;
        }
        
        .nav-mobile-links {
            display: flex;
            justify-content: space-around;
            align-items: center;
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .nav-mobile-links a {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            color: #cccccc;
            text-decoration: none;
            font-size: 0.8rem;
            transition: color 0.3s ease;
            padding: 0.5rem;
        }
        
        .nav-mobile-links a.active,
        .nav-mobile-links a:hover {
            color: #6366f1;
        }
        
        .nav-mobile-links .icon {
            font-size: 1.2rem;
        }
        
        /* Mobile Bottom Sheet for List */
        .mobile-bottom-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(20, 20, 20, 0.98);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px 20px 0 0;
            padding: 1.5rem;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            z-index: 1001;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .mobile-bottom-sheet.show {
            transform: translateY(0);
        }
        
        .bottom-sheet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .bottom-sheet-title {
            color: #ffffff;
            font-size: 1.3rem;
            font-weight: 700;
            margin: 0;
        }
        
        .bottom-sheet-close {
            background: none;
            border: none;
            color: #cccccc;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .bottom-sheet-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }
        
        .bottom-sheet-content {
            display: grid;
            gap: 1.5rem;
        }
        
        .bottom-sheet-section h4 {
            color: #ffffff;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            border-bottom: 2px solid rgba(99, 102, 241, 0.3);
            padding-bottom: 0.5rem;
        }
        
        .bottom-sheet-section ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .bottom-sheet-section li {
            margin: 1rem 0;
        }
        
        .bottom-sheet-section a {
            color: #cccccc;
            text-decoration: none;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }
        
        .bottom-sheet-section a:hover {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
        }
        
        .bottom-sheet-section .icon {
            font-size: 1.3rem;
            width: 24px;
            text-align: center;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .nav-desktop {
                display: none;
            }
            .nav-mobile-top {
                display: flex;
            }
            .nav-mobile {
                display: block;
            }
            body {
                padding-top: 70px;
                padding-bottom: 80px;
            }
        }
        
        @media (min-width: 769px) {
            body {
                padding-top: 80px;
            }
            .mobile-bottom-sheet {
                display: none;
            }
        }
    </style>
    
    <nav class="nav-container">
        <div class="nav-desktop">
            <a href="/home" class="nav-logo">⚡ NoMercy</a>
            <ul class="nav-links">
                <li><a href="/home" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
                <li><a href="/news" class="${activePage === 'news' ? 'active' : ''}">News</a></li>
                <li><a href="/profile" class="${activePage === 'profile' ? 'active' : ''}">Profile</a></li>
                <li class="nav-dropdown-container">
                    <button class="nav-dropdown-toggle ${activePage.startsWith('list') ? 'active' : ''}" onclick="toggleDropdown()">
                        List ▼
                    </button>
                    <div class="nav-dropdown" id="nav-dropdown">
                        <div class="dropdown-content">
                            <div class="dropdown-section">
                                <h4>🎯 Main</h4>
                                <ul>
                                    <li><a href="/list/leaderboard">🏆 Leaderboard</a></li>
                                    <li><a href="/list/shop">🛒 Shop</a></li>
                                    <li><a href="/list/quiz">🧠 Quiz</a></li>
                                    <li><a href="/list/redeem">🎁 Redeem</a></li>
                                </ul>
                            </div>
                            <div class="dropdown-section">
                                <h4>👥 Squad</h4>
                                <ul>
                                    <li><a href="/list/members">👤 Members</a></li>
                                    <li><a href="/list/tournament">🏅 Tournament</a></li>
                                    <li><a href="/list/division">⚔️ Division</a></li>
                                </ul>
                            </div>
                            <div class="dropdown-section">
                                <h4>🎰 Casino</h4>
                                <ul>
                                    <li><a href="/list/mine">💎 Mine</a></li>
                                    <li><a href="/list/tower">🗼 Tower</a></li>
                                    <li><a href="/list/coinflip">🪙 Coinflip</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
            <div class="nav-currency">
                <div class="currency-item balance-item">
                    <span class="currency-icon">💰</span>
                    <span id="nav-balance">0</span>
                </div>
                <div class="currency-item chips-item">
                    <span class="currency-icon">🎰</span>
                    <span id="nav-chips">0</span>
                </div>
            </div>
        </div>
        
        <!-- Mobile Top Navigation -->
        <div class="nav-mobile-top">
            <a href="/home" class="mobile-brand">⚡ NoMercy</a>
            <div class="mobile-currency">
                <div class="mobile-currency-item">
                    <span class="currency-icon">💰</span>
                    <span id="mobile-nav-balance">0</span>
                </div>
                <div class="mobile-currency-item">
                    <span class="currency-icon">🎰</span>
                    <span id="mobile-nav-chips">0</span>
                </div>
            </div>
        </div>
        
        <!-- Mobile Bottom Navigation -->
        <div class="nav-mobile">
            <ul class="nav-mobile-links">
                <li><a href="/home" class="${activePage === 'home' ? 'active' : ''}"><span class="icon">🏠</span>Home</a></li>
                <li><a href="/news" class="${activePage === 'news' ? 'active' : ''}"><span class="icon">📰</span>News</a></li>
                <li><a href="/profile" class="${activePage === 'profile' ? 'active' : ''}"><span class="icon">👤</span>Profile</a></li>
                <li><a href="javascript:void(0)" onclick="toggleMobileBottomSheet()" class="${activePage.startsWith('list') ? 'active' : ''}"><span class="icon">📋</span>List</a></li>
            </ul>
        </div>
        
        <!-- Mobile Bottom Sheet for List -->
        <div class="mobile-bottom-sheet" id="mobile-bottom-sheet">
            <div class="bottom-sheet-header">
                <h3 class="bottom-sheet-title">📋 Menu List</h3>
                <button class="bottom-sheet-close" onclick="toggleMobileBottomSheet()">✕</button>
            </div>
            <div class="bottom-sheet-content">
                <div class="bottom-sheet-section">
                    <h4>🎯 Main</h4>
                    <ul>
                        <li><a href="/list/leaderboard"><span class="icon">🏆</span>Leaderboard</a></li>
                        <li><a href="/list/shop"><span class="icon">🛒</span>Shop</a></li>
                        <li><a href="/list/quiz"><span class="icon">🧠</span>Quiz</a></li>
                        <li><a href="/list/redeem"><span class="icon">🎁</span>Redeem</a></li>
                    </ul>
                </div>
                <div class="bottom-sheet-section">
                    <h4>👥 Squad</h4>
                    <ul>
                        <li><a href="/list/members"><span class="icon">👤</span>Members</a></li>
                        <li><a href="/list/tournament"><span class="icon">🏅</span>Tournament</a></li>
                        <li><a href="/list/division"><span class="icon">⚔️</span>Division</a></li>
                    </ul>
                </div>
                <div class="bottom-sheet-section">
                    <h4>🎰 Casino</h4>
                    <ul>
                        <li><a href="/list/mine"><span class="icon">💎</span>Mine</a></li>
                        <li><a href="/list/tower"><span class="icon">🗼</span>Tower</a></li>
                        <li><a href="/list/coinflip"><span class="icon">🪙</span>Coinflip</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
    
    <script>
        // Desktop dropdown toggle
        function toggleDropdown() {
            const dropdown = document.getElementById('nav-dropdown');
            dropdown.classList.toggle('show');
        }
        
        // Mobile bottom sheet toggle
        function toggleMobileBottomSheet() {
            const bottomSheet = document.getElementById('mobile-bottom-sheet');
            bottomSheet.classList.toggle('show');
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('nav-dropdown');
            const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
            
            if (!dropdown.contains(event.target) && !dropdownToggle.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Update currency display
        async function updateNavCurrency() {
            try {
                const response = await fetch('/api/currency');
                const data = await response.json();
                
                if (data.success) {
                    // Desktop currency
                    document.getElementById('nav-balance').textContent = data.balance || 0;
                    document.getElementById('nav-chips').textContent = data.chips || 0;
                    
                    // Mobile currency
                    document.getElementById('mobile-nav-balance').textContent = data.balance || 0;
                    document.getElementById('mobile-nav-chips').textContent = data.chips || 0;
                }
            } catch (error) {
                console.log('Failed to update currency:', error);
            }
        }
        
        // Update currency when page loads
        document.addEventListener('DOMContentLoaded', updateNavCurrency);
        
        // Update currency every 30 seconds
        setInterval(updateNavCurrency, 30000);
    </script>
    `;
}

module.exports = { getNavigationTemplate };