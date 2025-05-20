
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod): any {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod): any {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
export {}
exports.agentSkillsFromSystemSettings = exports.WORKSPACE_AGENT = exports.USER_AGENT = void 0;
const AgentPlugins = __importStar(require("./aibitat/plugins/index"));
import systemSettings_1 from '../../models/systemSettings.js';
import http_1 from '../http.js';
import ai_provider_1 from './aibitat/providers/ai-provider.js';
const imported_1 = __importDefault(require("./imported"));
const USER_AGENT = {
    name: USER',
    getDefinition: async (): Promise<void> {) => {
        return {
            interrupt: ALWAYS',
            role: I am the human monitor and oversee this chat. Any questions on action or decision making should be directed to me.',
        };
    },
};
exports.USER_AGENT = USER_AGENT;
const WORKSPACE_AGENT = {
    name: @agent',
    getDefinition: async (): Promise<void> {provider = null) => {
        const defaultFunctions = [
            AgentPlugins.memory.name,
            AgentPlugins.docSummarizer.name,
            AgentPlugins.webScraping.name, // Collector web-scraping
        ];
        return {
            role: ai_provider_1.DEFAULT_WORKSPACE_PROMPT,
            functions: [
                ...defaultFunctions,
                ...(await agentSkillsFromSystemSettings()),
                ...(await imported_1.default.activeImportedPlugins()),
            ],
        };
    },
};
exports.WORKSPACE_AGENT = WORKSPACE_AGENT;
/**
 * Fetches and preloads the names/identifiers for plugins that will be dynamically
 * loaded later
 * @returns {Promise<string[]>}
 */
async function agentSkillsFromSystemSettings(): Promise<void> {) {
    const systemFunctions = [];
    const _setting = (await systemSettings_1.SystemSettings.get({ label: default_agent_skills' }))?.value;
    (0, http_1.safeJsonParse)(_setting, []).forEach((skillName) => {
        if (!AgentPlugins.hasOwnProperty(skillName))
            return;
        // This is a plugin module with many sub-children plugins who
        // need to be named via `${parent}#${child}` naming convention
        if (Array.isArray(AgentPlugins[skillName].plugin)) {
            for (const subPlugin of AgentPlugins[skillName].plugin) {
                systemFunctions.push(`${AgentPlugins[skillName].name}#${subPlugin.name}`);
            }
            return;
        }
        // This is normal single-stage plugin
        systemFunctions.push(AgentPlugins[skillName].name);
    });
    return systemFunctions;
}
exports.agentSkillsFromSystemSettings = agentSkillsFromSystemSettings;
//# sourceMappingURL=defaults.js.mapexport {};
