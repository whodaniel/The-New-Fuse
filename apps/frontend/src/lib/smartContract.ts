export {}
exports.smartContract = void 0;
class SmartContract {
    constructor() {
        this.appStacks = [];
        this.users = [];
    }
    createAppStack(creator, stackedApps, price) {
        const id = Math.random().toString(36).substr(2, 9);
        this.appStacks.push({ id, creator, stackedApps, price });
        return id;
    }
    purchaseAppStack(appStackId, buyer) {
        const appStack = this.appStacks.find(as => as.id === appStackId);
        if (!appStack)
            throw new Error('AppStack not found');
        const buyerUser = this.getOrCreateUser(buyer);
        if (buyerUser.balance < appStack.price)
            throw new Error('Insufficient funds');
        buyerUser.balance -= appStack.price;
        const creatorShare = appStack.price * 0.7;
        const stackedAppShare = appStack.price * 0.3 / appStack.stackedApps.length;
        this.getOrCreateUser(appStack.creator).balance += creatorShare;
        for (const stackedAppId of appStack.stackedApps) {
            const stackedApp = this.appStacks.find(as => as.id === stackedAppId);
            if (stackedApp) {
                this.getOrCreateUser(stackedApp.creator).balance += stackedAppShare;
            }
        }
    }
    getOrCreateUser(address) {
        let user = this.users.find(u => u.address === address);
        if (!user) {
            user = { address, balance: 0 };
            this.users.push(user);
        }
        return user;
    }
}
exports.smartContract = new SmartContract();
export {};
//# sourceMappingURL=smartContract.js.map