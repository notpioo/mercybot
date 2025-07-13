const { getNavigationTemplate } = require('./navigation');

// Base page template
function getBaseTemplate(title, content, activePage = '') {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NoMercy - ${title}</title>
    <meta name="description" content="NoMercy Dashboard - Manage your WhatsApp bot and casino games">
    <meta name="theme-color" content="#8b5cf6">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0idXJsKCNncmFkaWVudDBfbGluZWFyXzFfMSkiLz4KPHBhdGggZD0iTTE2IDhMMTMuNSAxNkwxOC41IDE2TDE4LjUgMjFMMTMuNSAyMUwxNiAyOUwxOC41IDIxTDIzLjUgMjFMMjEgMTNMMjMuNSAxM0wyMSA4TDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMzIiIHkyPSIzMiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjOGI1Y2Y2Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzYzNjZmMSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=">
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
            backdrop-filter: blur(10px);
        }
        .card h2 {
            color: #ffffff;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .card h3 {
            color: #cccccc;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }
        .btn {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
        }
        .btn-secondary {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        }
        .btn-secondary:hover {
            box-shadow: 0 10px 20px rgba(75, 85, 99, 0.3);
        }
        .grid {
            display: grid;
            gap: 2rem;
        }
        .grid-2 {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .grid-3 {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }
        .grid-4 {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        .text-center {
            text-align: center;
        }
        .text-sm {
            font-size: 0.875rem;
        }
        .text-lg {
            font-size: 1.125rem;
        }
        .text-xl {
            font-size: 1.25rem;
        }
        .text-2xl {
            font-size: 1.5rem;
        }
        .mb-2 {
            margin-bottom: 0.5rem;
        }
        .mb-4 {
            margin-bottom: 1rem;
        }
        .mb-6 {
            margin-bottom: 1.5rem;
        }
        .mt-2 {
            margin-top: 0.5rem;
        }
        .mt-4 {
            margin-top: 1rem;
        }
        .mt-6 {
            margin-top: 1.5rem;
        }
        .flex {
            display: flex;
        }
        .flex-col {
            flex-direction: column;
        }
        .items-center {
            align-items: center;
        }
        .justify-center {
            justify-content: center;
        }
        .justify-between {
            justify-content: space-between;
        }
        .gap-2 {
            gap: 0.5rem;
        }
        .gap-4 {
            gap: 1rem;
        }
        .gap-6 {
            gap: 1.5rem;
        }
        .p-2 {
            padding: 0.5rem;
        }
        .p-4 {
            padding: 1rem;
        }
        .p-6 {
            padding: 1.5rem;
        }
        .rounded {
            border-radius: 0.5rem;
        }
        .rounded-lg {
            border-radius: 0.75rem;
        }
        .bg-gray-800 {
            background-color: rgba(31, 41, 55, 0.8);
        }
        .bg-blue-600 {
            background-color: rgba(37, 99, 235, 0.8);
        }
        .bg-green-600 {
            background-color: rgba(34, 197, 94, 0.8);
        }
        .bg-red-600 {
            background-color: rgba(239, 68, 68, 0.8);
        }
        .bg-yellow-600 {
            background-color: rgba(234, 179, 8, 0.8);
        }
        .text-white {
            color: #ffffff;
        }
        .text-gray-300 {
            color: #d1d5db;
        }
        .text-blue-400 {
            color: #60a5fa;
        }
        .text-green-400 {
            color: #4ade80;
        }
        .text-red-400 {
            color: #f87171;
        }
        .text-yellow-400 {
            color: #facc15;
        }
        .border {
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .border-gray-600 {
            border-color: rgba(75, 85, 99, 0.8);
        }
        .shadow {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .shadow-lg {
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }
        .w-full {
            width: 100%;
        }
        .h-full {
            height: 100%;
        }
        .min-h-screen {
            min-height: 100vh;
        }
        .opacity-50 {
            opacity: 0.5;
        }
        .opacity-75 {
            opacity: 0.75;
        }
        .cursor-pointer {
            cursor: pointer;
        }
        .cursor-not-allowed {
            cursor: not-allowed;
        }
        .select-none {
            user-select: none;
        }
        .transition {
            transition: all 0.3s ease;
        }
        .hover\\:scale-105:hover {
            transform: scale(1.05);
        }
        .hover\\:opacity-80:hover {
            opacity: 0.8;
        }
        .focus\\:outline-none:focus {
            outline: none;
        }
        .focus\\:ring-2:focus {
            ring: 2px solid rgba(99, 102, 241, 0.5);
        }
        .disabled\\:opacity-50:disabled {
            opacity: 0.5;
        }
        .disabled\\:cursor-not-allowed:disabled {
            cursor: not-allowed;
        }

        /* Form styles */
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-label {
            display: block;
            color: #ffffff;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .form-input {
            width: 100%;
            padding: 0.75rem;
            background: rgba(31, 41, 55, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #ffffff;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        .form-input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .form-select {
            width: 100%;
            padding: 0.75rem;
            background: rgba(31, 41, 55, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #ffffff;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .form-select:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .form-textarea {
            width: 100%;
            padding: 0.75rem;
            background: rgba(31, 41, 55, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #ffffff;
            font-size: 1rem;
            resize: vertical;
            min-height: 120px;
            transition: all 0.3s ease;
        }
        .form-textarea:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        /* Table styles */
        .table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(31, 41, 55, 0.8);
            border-radius: 8px;
            overflow: hidden;
        }
        .table th {
            background: rgba(17, 24, 39, 0.8);
            color: #ffffff;
            font-weight: 600;
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .table td {
            padding: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: #d1d5db;
        }
        .table tr:hover {
            background: rgba(55, 65, 81, 0.5);
        }
        .table tr:last-child td {
            border-bottom: none;
        }

        /* Alert styles */
        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid;
        }
        .alert-success {
            background: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
            color: #4ade80;
        }
        .alert-error {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
            color: #f87171;
        }
        .alert-warning {
            background: rgba(234, 179, 8, 0.1);
            border-color: rgba(234, 179, 8, 0.3);
            color: #facc15;
        }
        .alert-info {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.3);
            color: #60a5fa;
        }

        /* Badge styles */
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            font-size: 0.875rem;
            font-weight: 600;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .badge-primary {
            background: rgba(99, 102, 241, 0.2);
            color: #a5b4fc;
        }
        .badge-success {
            background: rgba(34, 197, 94, 0.2);
            color: #4ade80;
        }
        .badge-warning {
            background: rgba(234, 179, 8, 0.2);
            color: #facc15;
        }
        .badge-error {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
        }
        .badge-secondary {
            background: rgba(107, 114, 128, 0.2);
            color: #9ca3af;
        }

        /* Progress bar styles */
        .progress {
            width: 100%;
            height: 0.5rem;
            background: rgba(31, 41, 55, 0.8);
            border-radius: 9999px;
            overflow: hidden;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            transition: width 0.3s ease;
        }

        /* Loading spinner */
        .spinner {
            width: 1rem;
            height: 1rem;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid #ffffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            .card {
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            .grid-2,
            .grid-3,
            .grid-4 {
                grid-template-columns: 1fr;
            }
            .table {
                font-size: 0.875rem;
            }
            .table th,
            .table td {
                padding: 0.75rem;
            }
        }
    </style>
</head>
<body>
    ${getNavigationTemplate(activePage)}

    <div class="container">
        ${content}
    </div>
</body>
</html>
    `;
}

module.exports = { getBaseTemplate };