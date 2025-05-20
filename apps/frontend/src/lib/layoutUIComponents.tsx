Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUI = exports.initializeSidebar = exports.initializeTheme = exports.toggleTheme = exports.initializeNavigation = exports.showNotification = exports.useLayout = exports.Tooltip = exports.Modal = exports.Dropdown = exports.Dialog = exports.Card = exports.Input = exports.Button = exports.ThemeToggle = exports.Sidebar = exports.Header = void 0;
var header_1 = require("./layout/header");
Object.defineProperty(exports, "Header", { enumerable: true, get: function () { return header_1.default; } });
var sidebar_1 = require("./layout/sidebar");
Object.defineProperty(exports, "Sidebar", { enumerable: true, get: function () { return sidebar_1.default; } });
var theme_toggle_1 = require("./layout/theme-toggle");
Object.defineProperty(exports, "ThemeToggle", { enumerable: true, get: function () { return theme_toggle_1.default; } });
var button_1 = require("./ui/button");
Object.defineProperty(exports, "Button", { enumerable: true, get: function () { return button_1.default; } });
var input_1 = require("./ui/input");
Object.defineProperty(exports, "Input", { enumerable: true, get: function () { return input_1.default; } });
var card_1 = require("./ui/card");
Object.defineProperty(exports, "Card", { enumerable: true, get: function () { return card_1.default; } });
var dialog_1 = require("./ui/dialog");
Object.defineProperty(exports, "Dialog", { enumerable: true, get: function () { return dialog_1.default; } });
var dropdown_1 = require("./ui/dropdown");
Object.defineProperty(exports, "Dropdown", { enumerable: true, get: function () { return dropdown_1.default; } });
var modal_1 = require("./ui/modal");
Object.defineProperty(exports, "Modal", { enumerable: true, get: function () { return modal_1.default; } });
var tooltip_1 = require("./ui/tooltip");
Object.defineProperty(exports, "Tooltip", { enumerable: true, get: function () { return tooltip_1.default; } });
import react_1 from 'react';
const LayoutContext = (0, react_1.createContext)(null);
const useLayout = () => {
    const context = (0, react_1.useContext)(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
exports.useLayout = useLayout;
const showNotification = (message, type = 'info', duration = 5000) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type} animate-slide-in`;
    const icon = getNotificationIcon(type);
    const colors = getNotificationColors(type);
    notification.innerHTML = `
        <div class="flex items-center p-4 ${colors.bg} ${colors.text} rounded-lg shadow-lg">
            ${icon}
            <p class="ml-3">${message}</p>
        </div>
    `;
    const notifications = document.getElementById('notifications');
    if (notifications) {
        notifications.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('animate-slide-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
};
exports.showNotification = showNotification;
const getNotificationIcon = (type) => {
    const icons = {
        success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>`,
        error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>`,
        warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>`,
        info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`
    };
    return icons[type];
};
const getNotificationColors = (type) => {
    const colors = {
        success: { bg: 'bg-green-100', text: 'text-green-800' },
        error: { bg: 'bg-red-100', text: 'text-red-800' },
        warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        info: { bg: 'bg-blue-100', text: 'text-blue-800' }
    };
    return colors[type];
};
const initializeNavigation = () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === window.location.pathname) {
            link.classList.add('active');
        }
    });
};
exports.initializeNavigation = initializeNavigation;
const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.classList.remove(currentTheme);
    html.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
};
exports.toggleTheme = toggleTheme;
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.add(savedTheme);
};
exports.initializeTheme = initializeTheme;
const initializeSidebar = () => {
    const toggleButton = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('[data-sidebar]');
    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('translate-x-0');
            sidebar.classList.toggle('translate-x-0', !isOpen);
            sidebar.classList.toggle('-translate-x-full', isOpen);
        });
    }
};
exports.initializeSidebar = initializeSidebar;
const initializeUI = () => {
    (0, exports.initializeTheme)();
    (0, exports.initializeNavigation)();
    (0, exports.initializeSidebar)();
};
exports.initializeUI = initializeUI;
export {};
//# sourceMappingURL=layoutUIComponents.js.map