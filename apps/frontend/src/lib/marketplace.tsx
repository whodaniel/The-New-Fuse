"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceManager = void 0;
class MarketplaceManager {
    constructor() {
        this.agents = [];
        this.currentFilters = {
            categories: [],
            priceRanges: [],
            minRating: 0,
            tags: []
        };
        this.initializeEventListeners();
    }
    static getInstance() {
        if (!MarketplaceManager.instance) {
            MarketplaceManager.instance = new MarketplaceManager();
        }
        return MarketplaceManager.instance;
    }
    initializeEventListeners() {
        // Search input handler
        const searchInput = document.querySelector('.search-input');
        searchInput?.addEventListener('input', this.debounce(() => {
            this.searchAgents(searchInput.value);
        }, 300));
        // Filter checkbox handlers
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateFilters();
            });
        });
        // Sort handler
        const sortButton = document.querySelector('button:contains("Sort By")');
        sortButton?.addEventListener('click', () => {
            this.showSortOptions();
        });
    }
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    async loadAgents() {
        try {
            const response = await fetch('/api/marketplace/agents');
            if (!response.ok)
                throw new Error('Failed to load agents');
            this.agents = await response.json();
            this.renderAgents(this.agents);
        }
        catch (error) {
            console.error('Error loading agents:', error);
            this.showError('Failed to load marketplace agents');
        }
    }
    async searchAgents(query) {
        try {
            const response = await fetch(`/api/marketplace/search?q=${encodeURIComponent(query)}`);
            if (!response.ok)
                throw new Error('Search failed');
            const results = await response.json();
            this.renderAgents(results);
        }
        catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }
    updateFilters() {
        const newFilters = {
            categories: [],
            priceRanges: [],
            minRating: 0,
            tags: []
        };
        // Collect selected categories
        document.querySelectorAll('[data-filter="category"]:checked').forEach(checkbox => {
            newFilters.categories.push(checkbox.value);
        });
        // Collect price ranges
        document.querySelectorAll('[data-filter="price"]:checked').forEach(checkbox => {
            const [min, max] = checkbox.value.split('-');
            newFilters.priceRanges.push({
                min: parseFloat(min),
                max: max === 'inf' ? Infinity : parseFloat(max)
            });
        });
        // Get minimum rating
        const ratingFilter = document.querySelector('[data-filter="rating"]:checked');
        if (ratingFilter) {
            newFilters.minRating = parseInt(ratingFilter.value);
        }
        this.currentFilters = newFilters;
        this.applyFilters();
    }
    applyFilters() {
        const filteredAgents = this.agents.filter(agent => {
            // Category filter
            if (this.currentFilters.categories.length &&
                !this.currentFilters.categories.includes(agent.category)) {
                return false;
            }
            // Price range filter
            if (this.currentFilters.priceRanges.length) {
                const priceMatch = this.currentFilters.priceRanges.some(rang(e: any) => agent.price >= range.min && agent.price <= range.max);
                if (!priceMatch)
                    return false;
            }
            // Rating filter
            if (this.currentFilters.minRating > 0 &&
                agent.rating.average < this.currentFilters.minRating) {
                return false;
            }
            // Tag filter
            if (this.currentFilters.tags.length) {
                const agentTags = agent.tags.map(t => t.id);
                const hasAllTags = this.currentFilters.tags.every(tag => agentTags.includes(tag));
                if (!hasAllTags)
                    return false;
            }
            return true;
        });
        this.renderAgents(filteredAgents);
    }
    renderAgents(agents) {
        const container = document.querySelector('.marketplace-grid');
        if (!container)
            return;
        container.innerHTML = agents.map(agent => this.createAgentCard(agent)).join('');
    }
    createAgentCard(agent) {
        return `
            <div class="agent-card" data-agent-id="${agent.id}">
                <div class="relative">
                    <div class="agent-image" style="background-image: url(${agent.image})"></div>
                    <span class="price-tag">$${agent.price.toFixed(2)}</span>
                </div>
                <div class="p-6 space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-bold text-gray-900">${agent.name}</h3>
                        <div class="rating-stars">
                            ${this.generateStars(agent.rating.average)}
                        </div>
                    </div>
                    <p class="text-gray-600">${agent.description}</p>
                    <div class="flex flex-wrap gap-2">
                        ${agent.tags.map(tag => `
                            <span class="tag tag-${tag.type}">${tag.name}</span>
                        `).join('')}
                    </div>
                    <button class="w-full btn bg-blue-600 text-white hover:bg-blue-700">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        return '★'.repeat(fullStars) +
            (hasHalfStar ? '½' : '') +
            '☆'.repeat(emptyStars);
    }
    showSortOptions() {
        const sortOptions = [
            { label: 'Most Popular', value: 'popular' },
            { label: 'Highest Rated', value: 'rating' },
            { label: 'Newest', value: 'newest' },
            { label: 'Price: Low to High', value: 'price_asc' },
            { label: 'Price: High to Low', value: 'price_desc' }
        ];
        const menu = document.createElement('div');
        menu.className = 'absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5';
        menu.innerHTML = `
            <div class="py-1" role="menu">
                ${sortOptions.map(option => `
                    <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                            role="menuitem" 
                            data-sort="${option.value}">
                        ${option.label}
                    </button>
                `).join('')}
            </div>
        `;
        document.body.appendChild(menu);
        // Handle option selection
        menu.addEventListener('click', (e) => {
            const target = e.target;
            if (target.hasAttribute('data-sort')) {
                this.sortAgents(target.getAttribute('data-sort'));
                menu.remove();
            }
        });
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
            }
        }, { once: true });
    }
    sortAgents(sortBy) {
        const sortedAgents = [...this.agents].sort((a, b) => {
            switch (sortBy) {
                case 'popular':
                    return b.stats.downloads - a.stats.downloads;
                case 'rating':
                    return b.rating.average - a.rating.average;
                case 'newest':
                    return new Date(b.id).getTime() - new Date(a.id).getTime();
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });
        this.renderAgents(sortedAgents);
    }
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
        errorDiv.role = 'alert';
        errorDiv.innerHTML = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}
// Initialize marketplace manager
const marketplaceManager = MarketplaceManager.getInstance();
exports.marketplaceManager = marketplaceManager;

export {};
