"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trae_agent_1 = require("../services/agent/trae-agent");
async function main() {
    const agent = new trae_agent_1.TraeAgent();
    process.on('SIGINT', async () => {
        await agent.cleanup();
        process.exit(0);
    });
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=run-trae-agent.js.map