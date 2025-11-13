const { exec } = require('child_process');

// Base URL - adjust this based on your development server
const BASE_URL = 'http://localhost:3000';

// List of all main pages to launch
const pages = [
    '/', // Home/Landing
    '/login',
    '/dashboard',
    '/admin',
    '/settings',
    '/analytics',
    '/workspace',
    '/timeline-demo',
    '/graph-demo',
    '/ai-agent-portal',
    '/general-settings',
    '/auth/register',
    '/workspace/overview',
    '/workspace/analytics',
    '/workspace/settings',
];

// Function to open URL in Chrome
function openInChrome(url) {
    const command = process.platform === 'darwin' 
        ? `open -a "Google Chrome" "${url}"`
        : process.platform === 'win32'
        ? `start chrome "${url}"`
        : `google-chrome "${url}"`;

    exec(command, (error) => {
        if (error) {
            console.error(`Error opening ${url}: ${error}`);
        } else {
            console.log(`Opened ${url}`);
        }
    });
}

// Launch all pages with a small delay between each
pages.forEach((page, index) => {
    setTimeout(() => {
        openInChrome(`${BASE_URL}${page}`);
    }, index * 1000); // 1 second delay between each page
});

console.log('Launching all pages...');