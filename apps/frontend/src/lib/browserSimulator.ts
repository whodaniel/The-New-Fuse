    constructor() {
        this.currentURL = null;
    }
    navigate(url) {
        
        this.currentURL = url;

    }
}
const logger = new URLLogger();
logger.navigate('dogs.com');
export {};
//# sourceMappingURL=browserSimulator.js.map