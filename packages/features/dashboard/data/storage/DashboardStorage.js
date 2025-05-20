"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardStorage = void 0;
class DashboardStorage {
    constructor(storage = localStorage, prefix = 'dashboard_') {
        this.storage = storage;
        this.prefix = prefix;
    }
}
exports.DashboardStorage = DashboardStorage;
() => ;
(dashboard) => {
    const key, as, any, version, state, timestamp;
    () => as;
    any;
    lastModifiedBy.id,
    ;
};
;
this.(storage).setItem(historyKey, JSON.stringify(history));
async;
loadDashboard();
Promise();
Promise(id, string);
Promise < types_1.DashboardState | null > {
    const: key, unknown, null: 
};
async;
deleteDashboard();
Promise();
Promise(id, string);
Promise < void  > {
    const: key = this.getKey(dashboard.id),
    const: serialized = JSON.stringify(dashboard)
}(this).(storage).setItem(key, serialized);
// Save to version history
const historyKey = this.getHistoryKey(dashboard.id);
const history = this.getDashboardHistory(dashboard.id);
history.push({
    version(as, any) {
        const dashboards = this.getHistoryKey(id), unknown;
    }
});
{
    const key, { dashboards, push };
    (dashboard);
    string,
        config;
    types_1.ShareConfig;
    Promise < void  > {
        const: key, string, []:  > {
            const: key = this.(storage).key(i),
            if(key, startsWith) { }
        }(this.prefix) && !key.includes('_history_')
    };
    {
        const dashboard = await this, unknown, [];
    }
    async;
    deleteShareConfig();
    Promise();
    Promise(dashboardId, string, configId, string);
    Promise < void  > {
        const: key, string,
        version: number
    } | null > {
        const: history = this.(storage).getItem(key), unknown
    };
    {
        const dashboard, string, { return:  };
        `${this.prefix}${id}`;
    }
    getHistoryKey(id, string);
    string;
    {
        return `${this.prefix}${id}_history`;
    }
    getShareKey(id, string);
    string;
    {
        return `${this.prefix}${id}_share`;
    }
    getDashboardHistory(id, string);
    Array < {
        version: number,
        state: string,
        timestamp: Date,
        userId: string
    } > {
        const: key = history.find((entry), this.getHistoryKey(id)),
        const: serialized = this.(storage).getItem(key),
        return: serialized ? JSON.parse(serialized, unknown) : []
    };
}
//# sourceMappingURL=DashboardStorage.js.map