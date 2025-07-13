// Navigation template functions
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

        .dropdown-section {
            text-align: center;
        }

        .dropdown-section h4 {
            color: #ffffff;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #6366f1;
        }

        .dropdown-section ul {
            list-style: none;
            padding: 0;
            margin: 0;
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

        /* Currency Navigation */
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
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        }

        .currency-icon {
            font-size: 1rem;
        }

        /* Mobile Top Navigation */
        .nav-mobile-top {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem 2rem;
            z-index: 1000;
            justify-content: space-between;
            align-items: center;
        }

        .nav-mobile-logo {
            font-size: 1.2rem;
            font-weight: 700;
            color: #ffffff;
        }

        .nav-mobile-currency {
            display: flex;
            gap: 0.75rem;
        }

        .nav-mobile-currency .currency-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.4rem 0.8rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        /* Mobile Bottom Navigation */
        .nav-mobile {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem 0;
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

        .nav-mobile-links a,
        .nav-mobile-links button {
            color: #cccccc;
            text-decoration: none;
            font-size: 0.75rem;
            font-weight: 500;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            transition: color 0.3s ease;
            background: none;
            border: none;
            cursor: pointer;
            font-family: inherit;
        }

        .nav-mobile-links a:hover,
        .nav-mobile-links a.active,
        .nav-mobile-links button:hover,
        .nav-mobile-links button.active {
            color: #6366f1;
        }

        .nav-mobile-links .nav-icon {
            font-size: 1.25rem;
        }

        /* Mobile Bottom Sheet */
        .mobile-bottom-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(15, 15, 15, 0.98);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px 20px 0 0;
            padding: 2rem;
            z-index: 1001;
            transform: translateY(100%);
            transition: transform 0.3s ease;
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
            margin-bottom: 2rem;
        }

        .bottom-sheet-header h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin: 0;
        }

        .close-bottom-sheet {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #ffffff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }

        .bottom-sheet-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bottom-sheet-tab {
            background: none;
            border: none;
            color: #cccccc;
            font-size: 1rem;
            font-weight: 500;
            padding: 1rem 0;
            cursor: pointer;
            position: relative;
            flex: 1;
            text-align: center;
            transition: color 0.3s ease;
        }

        .bottom-sheet-tab.active {
            color: #6366f1;
        }

        .bottom-sheet-tab.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: #6366f1;
        }

        .bottom-sheet-content {
            display: none;
        }

        .bottom-sheet-content.active {
            display: block;
        }

        .bottom-sheet-section ul {
            list-style: none;
            padding: 0;
            margin: 0;
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
                                    <li><a href="/list/shop">🛒 Shop</a></li>
                                    <li><a href="/list/quiz">🧠 Quiz</a></li>
                                    <li><a href="/list/redeem">🎁 Redeem</a></li>
                                    <li><a href="/list/inventory">🎒 Inventory</a></li>
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
                <div class="currency-item">
                    <span class="currency-icon">💵</span>
                    <span id="nav-balance">-</span>
                </div>
                <div class="currency-item">
                    <span class="currency-icon">🎰</span>
                    <span id="nav-chips">-</span>
                </div>
            </div>
        </div>
    </nav>

    <div class="nav-mobile-top">
        <div class="nav-mobile-logo">⚡ NoMercy</div>
        <div class="nav-mobile-currency">
            <div class="currency-item">
                <span class="currency-icon">💵</span>
                <span id="nav-balance-mobile">-</span>
            </div>
            <div class="currency-item">
                <span class="currency-icon">🎰</span>
                <span id="nav-chips-mobile">-</span>
            </div>
        </div>
    </div>

    <nav class="nav-mobile">
        <ul class="nav-mobile-links">
            <li><a href="/home" class="${activePage === 'home' ? 'active' : ''}">
                <span class="nav-icon">🏠</span>
                <span>Home</span>
            </a></li>
            <li><a href="/news" class="${activePage === 'news' ? 'active' : ''}">
                <span class="nav-icon">📰</span>
                <span>News</span>
            </a></li>
            <li><a href="/profile" class="${activePage === 'profile' ? 'active' : ''}">
                <span class="nav-icon">👤</span>
                <span>Profile</span>
            </a></li>
            <li><button onclick="toggleMobileBottomSheet()" class="${activePage.startsWith('list') ? 'active' : ''}">
                <span class="nav-icon">📋</span>
                <span>List</span>
            </button></li>
        </ul>
    </nav>

    <!-- Mobile Bottom Sheet -->
    <div class="mobile-bottom-sheet" id="mobile-bottom-sheet">
        <div class="bottom-sheet-header">
            <h3>Menu List</h3>
            <button class="close-bottom-sheet" onclick="toggleMobileBottomSheet()">×</button>
        </div>

        <div class="bottom-sheet-tabs">
            <button class="bottom-sheet-tab active" onclick="switchBottomSheetTab('main')">Main</button>
            <button class="bottom-sheet-tab" onclick="switchBottomSheetTab('squad')">Squad</button>
            <button class="bottom-sheet-tab" onclick="switchBottomSheetTab('casino')">Casino</button>
        </div>

        <div class="bottom-sheet-content active" id="main-content">
            <div class="bottom-sheet-section">
                <ul>
                    <li><a href="/list/shop"><span class="icon">🛒</span> Shop</a></li>
                    <li><a href="/list/quiz"><span class="icon">🧠</span> Quiz</a></li>
                    <li><a href="/list/redeem"><span class="icon">🎁</span> Redeem</a></li>
                    <li><a href="/list/inventory"><span class="icon">🎒</span> Inventory</a></li>
                </ul>
            </div>
        </div>

        <div class="bottom-sheet-content" id="squad-content">
            <div class="bottom-sheet-section">
                <ul>
                    <li><a href="/list/members"><span class="icon">👤</span> Members</a></li>
                    <li><a href="/list/tournament"><span class="icon">🏅</span> Tournament</a></li>
                    <li><a href="/list/division"><span class="icon">⚔️</span> Division</a></li>
                </ul>
            </div>
        </div>

        <div class="bottom-sheet-content" id="casino-content">
            <div class="bottom-sheet-section">
                <ul>
                    <li><a href="/list/mine"><span class="icon">💎</span> Mine</a></li>
                    <li><a href="/list/tower"><span class="icon">🗼</span> Tower</a></li>
                    <li><a href="/list/coinflip"><span class="icon">🪙</span> Coinflip</a></li>
                </ul>
            </div>
        </div>
    </div>

    <script>
        // Function to update navigation currency
        async function updateNavCurrency() {
            try {
                const response = await fetch('/api/user-currency');
                const data = await response.json();

                if (data.success) {
                    // Update desktop navigation
                    const balanceEl = document.getElementById('nav-balance');
                    const chipsEl = document.getElementById('nav-chips');

                    // Update mobile navigation
                    const balanceMobileEl = document.getElementById('nav-balance-mobile');
                    const chipsMobileEl = document.getElementById('nav-chips-mobile');

                    if (balanceEl) balanceEl.textContent = data.balance;
                    if (chipsEl) chipsEl.textContent = data.chips;
                    if (balanceMobileEl) balanceMobileEl.textContent = data.balance;
                    if (chipsMobileEl) chipsMobileEl.textContent = data.chips;
                }
            } catch (error) {
                console.error('Error updating nav currency:', error);
            }
        }

        // Desktop dropdown functionality
        function toggleDropdown() {
            const dropdown = document.getElementById('nav-dropdown');
            dropdown.classList.toggle('show');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('nav-dropdown');
            const toggle = document.querySelector('.nav-dropdown-toggle');

            if (!dropdown.contains(event.target) && !toggle.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });

        // Mobile bottom sheet functionality
        function toggleMobileBottomSheet() {
            const bottomSheet = document.getElementById('mobile-bottom-sheet');
            bottomSheet.classList.toggle('show');
        }

        function switchBottomSheetTab(tabName) {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.bottom-sheet-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.bottom-sheet-content').forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            event.target.classList.add('active');
            document.getElementById(tabName + '-content').classList.add('active');
        }

        // Update currency when page loads
        document.addEventListener('DOMContentLoaded', updateNavCurrency);

        // Update currency every 30 seconds
        setInterval(updateNavCurrency, 30000);
    </script>
    `;
}

module.exports = { getNavigationTemplate };