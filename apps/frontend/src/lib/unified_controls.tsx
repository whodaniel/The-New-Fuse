    constructor() {
        this.isOpen = false;
        this.commandPalette = document.getElementById('command-palette');
        this.setupEventListeners();
    }
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
    open() {
        this.commandPalette.classList.remove('hidden');
        this.isOpen = true;
    }
    close() {
        this.commandPalette.classList.add('hidden');
        this.isOpen = false;
    }
}
class DarkModeToggle {
    constructor() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }
    init() {
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        }
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    }
    toggle() {
        this.darkMode = !this.darkMode;
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', this.darkMode);
    }
}
class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
    }
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-lg shadow-lg mb-4 flex items-center`;
        const icon = this.getIcon(type);
        toast.innerHTML = `
      <div class="mr-3">${icon}</div>
      <div>${message}</div>
    `;
        this.container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle text-green-500"></i>',
            error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
            info: '<i class="fas fa-info-circle text-blue-500"></i>',
        };
        return icons[type] || icons.info;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.commandPalette = new CommandPalette();
    window.darkMode = new DarkModeToggle();
    window.toastManager = new ToastManager();
});
export {};
//# sourceMappingURL=unified_controls.js.map