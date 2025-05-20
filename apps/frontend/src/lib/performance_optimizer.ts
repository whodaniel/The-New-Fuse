    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.initializeObservers();
    }
    initializeObservers() {
        this.observeResourceTiming();
        this.observeLongTasks();
        this.setupLazyLoading();
    }
    observeResourceTiming() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 1000) {
                    console.warn(`Slow resource load: ${entry.name}`);
                }
            }
        });
        observer.observe({ entryTypes: ['resource'] });
    }
    observeLongTasks() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.warn(`Long task detected: ${entry.name}, duration: ${entry.duration}ms`);
            }
        });
        observer.observe({ entryTypes: ['longtask'] });
    }
    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => this.handleIntersection(entries), { rootMargin: '50px' });
        document.querySelectorAll('[data-lazy]')
            .forEach(el => observer.observe(el));
    }
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const lazyElement = entry.target;
                const src = lazyElement.getAttribute('data-src');
                if (src) {
                    lazyElement.setAttribute('src', src);
                    lazyElement.removeAttribute('data-lazy');
                }
                this.debounce(() => observer.unobserve(lazyElement), 500, lazyElement);
            }
        });
    }
    debounce(func, wait, element) {
        clearTimeout(this.debounceTimers.get(element));
        this.debounceTimers.set(element, setTimeout(() => {
            func();
            this.debounceTimers.delete(element);
        }, wait));
    }
    cacheResource(url, data) {
        this.cache.set(url, data);
    }
    getCachedResource(url) {
        return this.cache.get(url);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const performanceOptimizer = new PerformanceOptimizer();
});
export {};
//# sourceMappingURL=performance_optimizer.js.map