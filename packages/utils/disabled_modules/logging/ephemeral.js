"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m")
        throw new TypeError("Private method is not writable");
    if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _EphemeralAgentHandler_instances, _EphemeralAgentHandler_invocationUUID, _EphemeralAgentHandler_workspace, _EphemeralAgentHandler_userId, _EphemeralAgentHandler_threadId, _EphemeralAgentHandler_sessionId, _EphemeralAgentHandler_prompt, _EphemeralAgentHandler_funcsToLoad, _EphemeralAgentHandler_chatHistory, _EphemeralAgentHandler_getFallbackProvider, _EphemeralAgentHandler_fetchModel, _EphemeralAgentHandler_providerSetupAndCheck, _EphemeralAgentHandler_attachPlugins, _EphemeralAgentHandler_loadAgents;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EphemeralEventListener = exports.EphemeralAgentHandler = void 0;
const aibitat_1 = __importDefault(require("./aibitat"));
const plugins_1 = __importDefault(require("./aibitat/plugins"));
const imported_1 = __importDefault(require("./imported"));
import http_socket_1 from './aibitat/plugins/http-socket.js';
import workspaceChats_1 from '../../models/workspaceChats';
import http_1 from '../http.js';
import defaults_1 from './defaults.js';
import _1 from '.';
import workspaceAgentInvocation_1 from '../../models/workspaceAgentInvocation';
const node_events_1 = __importDefault(require("node:events"));
import responses_1 from '../helpers/chat/responses.js';
/**
 * This is an instance and functional Agent handler, but it does not utilize
 * sessions or websocket's and is instead a singular one-off agent run that does
 * not persist between invocations
 */
class EphemeralAgentHandler extends _1.AgentHandler {
    /**
     * @param {{
     * uuid: string,
     * workspace: import("@the-new-fuse/database/client").workspaces,
     * prompt: string,
     * userId: import("@the-new-fuse/database/client").users["id"]|null,
     * threadId: import("@the-new-fuse/database/client").workspace_threads["id"]|null,
     * sessionId: string|null
     * }} parameters
     */
    constructor({ uuid, workspace, prompt, userId = null, threadId = null, sessionId = null, }) {
        super({ uuid });
        _EphemeralAgentHandler_instances.add(this);
        /** @type {string|null} the unique identifier for the agent invocation */
        _EphemeralAgentHandler_invocationUUID.set(this, null);
        /** @type {import("@the-new-fuse/database/client").workspaces|null} the workspace to use for the agent */
        _EphemeralAgentHandler_workspace.set(this, null);
        /** @type {import("@the-new-fuse/database/client").users|null} the user id to use for the agent */
        _EphemeralAgentHandler_userId.set(this, null);
        /** @type {import("@the-new-fuse/database/client").workspace_threads|null} the workspace thread id to use for the agent */
        _EphemeralAgentHandler_threadId.set(this, null);
        /** @type {string|null} the session id to use for the agent */
        _EphemeralAgentHandler_sessionId.set(this, null);
        /** @type {string|null} the prompt to use for the agent */
        _EphemeralAgentHandler_prompt.set(this, null);
        /** @type {string[]} the functions to load into the agent (Aibitat plugins) */
        _EphemeralAgentHandler_funcsToLoad.set(this, []);
        /** @type {AIbitat|null} */
        this.aibitat = null;
        /** @type {string|null} */
        this.channel = null;
        /** @type {string|null} */
        this.provider = null;
        /** @type {string|null} the model to use for the agent */
        this.model = null;
        __classPrivateFieldSet(this, _EphemeralAgentHandler_invocationUUID, uuid, "f");
        __classPrivateFieldSet(this, _EphemeralAgentHandler_workspace, workspace, "f");
        __classPrivateFieldSet(this, _EphemeralAgentHandler_prompt, prompt, "f");
        __classPrivateFieldSet(this, _EphemeralAgentHandler_userId, userId, "f");
        __classPrivateFieldSet(this, _EphemeralAgentHandler_threadId, threadId, "f");
        __classPrivateFieldSet(this, _EphemeralAgentHandler_sessionId, sessionId, "f");
    }
    log(text, ...args) {
        
    }
    closeAlert() {
        this.log(`End ${__classPrivateFieldGet(this, _EphemeralAgentHandler_invocationUUID, "f")}::${this.provider}:${this.model}`);
    }
}
() => ;
() => {
    __classPrivateFieldGet(this, _EphemeralAgentHandler_instances, "m", _EphemeralAgentHandler_providerSetupAndCheck).call(this);
    return this;
};
async;
createAIbitat();
Promise();
Promise(args = {
    handler: null,
});
{
    this.aibitat = new aibitat_1.default({
        provider: this.provider ?? 'openai',
        model: this.model ?? 'gpt-4o',
        chats: await __classPrivateFieldGet(this, _EphemeralAgentHandler_instances, "m", _EphemeralAgentHandler_chatHistory).call(this, 20),
        handlerProps: {
            invocation: {
                workspace: __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f"),
                workspace_id: __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").id,
            },
            log: this.log,
        },
    });
    // Attach HTTP response object if defined for chunk streaming.
    this.log(`Attached ${http_socket_1.httpSocket.name} plugin to Agent cluster`);
    this.aibitat.use(http_socket_1.httpSocket.plugin({
        handler: args.handler,
        muteUserReply: true,
        introspection: true,
    }));
    // Load required agents (Default + custom)
    await __classPrivateFieldGet(this, _EphemeralAgentHandler_instances, "m", _EphemeralAgentHandler_loadAgents).call(this);
    // Attach all required plugins for functions to operate.
    __classPrivateFieldGet(this, _EphemeralAgentHandler_instances, "m", _EphemeralAgentHandler_attachPlugins).call(this, args);
}
startAgentCluster();
{
    return this.aibitat.start({
        from: defaults_1.USER_AGENT.name,
        to: this.channel ?? defaults_1.WORKSPACE_AGENT.name,
        content: __classPrivateFieldGet(this, _EphemeralAgentHandler_prompt, "f"),
    });
}
isAgentInvocation({ message });
{
    const agentHandles = workspaceAgentInvocation_1.WorkspaceAgentInvocation.parseAgents(message);
    if (agentHandles.length > 0)
        return true;
    return false;
}
exports.EphemeralAgentHandler = EphemeralAgentHandler;
_EphemeralAgentHandler_invocationUUID = new WeakMap(), _EphemeralAgentHandler_workspace = new WeakMap(), _EphemeralAgentHandler_userId = new WeakMap(), _EphemeralAgentHandler_threadId = new WeakMap(), _EphemeralAgentHandler_sessionId = new WeakMap(), _EphemeralAgentHandler_prompt = new WeakMap(), _EphemeralAgentHandler_funcsToLoad = new WeakMap(), _EphemeralAgentHandler_instances = new WeakSet(), _EphemeralAgentHandler_chatHistory = ()();
Promise(limit = 10);
{
    try {
        const rawHistory = (await workspaceChats_1.WorkspaceChats.where({
            workspaceId: __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").id,
            user_id: __classPrivateFieldGet(this, _EphemeralAgentHandler_userId, "f") || null,
            thread_id: __classPrivateFieldGet(this, _EphemeralAgentHandler_threadId, "f") || null,
            api_session_id: __classPrivateFieldGet(this, _EphemeralAgentHandler_sessionId, "f"),
            include: true,
        }, limit, { id: 'desc' })).reverse();
        const agentHistory = [];
        rawHistory.forEach(chatLog => {
            agentHistory.push({
                from: defaults_1.USER_AGENT.name,
                to: defaults_1.WORKSPACE_AGENT.name,
                content: chatLog.prompt,
                state: 'success',
            }, {
                from: defaults_1.WORKSPACE_AGENT.name,
                to: defaults_1.USER_AGENT.name,
                content: (0, http_1.safeJsonParse)(chatLog.response)?.text || '',
                state: 'success',
            });
        });
        return agentHistory;
    }
    catch (e) {
        this.log('Error loading chat history', e.message);
        return [];
    }
}
_EphemeralAgentHandler_getFallbackProvider = function _EphemeralAgentHandler_getFallbackProvider() {
    // First, fallback to the workspace chat provider and model if they exist
    if (__classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").chatProvider && __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").chatModel) {
        return {
            provider: __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").chatProvider,
            model: __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").chatModel,
        };
    }
    // If workspace does not have chat provider and model fallback
    // to system provider and try to load provider default model
    const systemProvider = process.env.LLM_PROVIDER;
    const systemModel = this.providerDefault(systemProvider);
    if (systemProvider && systemModel) {
        return {
            provider: systemProvider,
            model: systemModel,
        };
    }
    return null;
}, _EphemeralAgentHandler_fetchModel = function _EphemeralAgentHandler_fetchModel() {
    // Provider was not explicitly set for workspace, so we are going to run our fallback logic
    // that will set a provider and model for us to use.
    if (!this.provider) {
        const fallback = __classPrivateFieldGet(this, _EphemeralAgentHandler_instances, "m", _EphemeralAgentHandler_getFallbackProvider).call(this);
        if (!fallback)
            throw new Error('No valid provider found for the agent.');
        this.provider = fallback.provider; // re-set the provider to the fallback provider so it is not null.
        return fallback.model; // set its defined model based on fallback logic.
    }
    // The provider was explicitly set, so check if the workspace has an agent model set.
    if (__classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").agentModel)
        return __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").agentModel;
    // Otherwise, we have no model to use - so guess a default model to use via the provider
    // and it's system ENV params and if that fails - we return either a base model or null.
    return this.providerDefault();
}, _EphemeralAgentHandler_providerSetupAndCheck = function _EphemeralAgentHandler_providerSetupAndCheck() {
    this.provider = __classPrivateFieldGet(this, _EphemeralAgentHandler_workspace, "f").agentProvider ?? null;
    this.model = __classPrivateFieldGet(this, _EphemeralAgentHandler_instances, "m", _EphemeralAgentHandler_fetchModel).call(this);
    if (!this.provider)
        throw new Error('No valid provider found for the agent.');
    this.log(`Start ${__classPrivateFieldGet(this, _EphemeralAgentHandler_invocationUUID, "f")}::${this.provider}:${this.model}`);
    this.checkSetup();
}, _EphemeralAgentHandler_attachPlugins = function _EphemeralAgentHandler_attachPlugins(args) {
    for (const name of __classPrivateFieldGet(this, _EphemeralAgentHandler_funcsToLoad, "f")) {
        // Load child plugin
        if (name.includes('#')) {
            const [parent, childPluginName] = name.split('#');
            if (!plugins_1.default.hasOwnProperty(parent)) {
                this.log(`${parent} is not a valid plugin. Skipping inclusion to agent cluster.`);
                continue;
            }
            const childPlugin = plugins_1.default[parent].plugin.find(child => child.name === childPluginName);
            if (!childPlugin) {
                this.log(`${parent} does not have child plugin named ${childPluginName}. Skipping inclusion to agent cluster.`);
                continue;
            }
            const callOpts = this.parseCallOptions(args, childPlugin?.startupConfig?.params, name);
            this.aibitat.use(childPlugin.plugin(callOpts));
            this.log(`Attached ${parent}:${childPluginName} plugin to Agent cluster`);
            continue;
        }
        // Load imported plugin. This is marked by `@@` in the array of functions to load.
        // and is the @@hubID of the plugin.
        if (name.startsWith('@@')) {
            const hubId = name.replace('@@', '');
            const valid = imported_1.default.validateImportedPluginHandler(hubId);
            if (!valid) {
                this.log(`Imported plugin by hubId ${hubId} not found in plugin directory. Skipping inclusion to agent cluster.`);
                continue;
            }
            const plugin = imported_1.default.loadPluginByHubId(hubId);
            const callOpts = plugin.parseCallOptions();
            this.aibitat.use(plugin.plugin(callOpts));
            this.log(`Attached ${plugin.name} (${hubId}) imported plugin to Agent cluster`);
            continue;
        }
        // Load single-stage plugin.
        if (!plugins_1.default.hasOwnProperty(name)) {
            this.log(`${name} is not a valid plugin. Skipping inclusion to agent cluster.`);
            continue;
        }
        const callOpts = this.parseCallOptions(args, plugins_1.default[name].startupConfig.params);
        const AIbitatPlugin = plugins_1.default[name];
        this.aibitat.use(AIbitatPlugin.plugin(callOpts));
        this.log(`Attached ${name} plugin to Agent cluster`);
    }
}, _EphemeralAgentHandler_loadAgents = ()();
Promise();
{
    // Default User agent and workspace agent
    this.log(`Attaching user and default agent to Agent cluster.`);
    this.aibitat.agent(defaults_1.USER_AGENT.name, await defaults_1.USER_AGENT.getDefinition());
    this.aibitat.agent(defaults_1.WORKSPACE_AGENT.name, await defaults_1.WORKSPACE_AGENT.getDefinition(this.provider));
    __classPrivateFieldSet(this, _EphemeralAgentHandler_funcsToLoad, [
        plugins_1.default.memory.name,
        plugins_1.default.docSummarizer.name,
        plugins_1.default.webScraping.name,
        ...(await (0, defaults_1.agentSkillsFromSystemSettings)()),
        ...(await imported_1.default.activeImportedPlugins()),
    ], "f");
}
;
/**
 * This is a special EventEmitter specifically used in the Aibitat agent handler
 * that enables us to use HTTP to relay all .introspect and .send events back to an
 * http handler instead of websockets, like we do on the frontend. This interface is meant to
 * mock a websocket interface for the methods used and bind them to an HTTP method so that the developer
 * API can invoke agent calls.
 */
class EphemeralEventListener extends node_events_1.default {
    constructor() {
        super();
        this.messages = [];
    }
    send(jsonData) {
        const data = JSON.parse(jsonData);
        this.messages.push(data);
        this.emit('chunk', data);
    }
    close() {
        this.emit('closed');
    }
    /**
     * Compacts all messages in class and returns them in a condensed format.
     * @returns {{thoughts: string[], textResponse: string}}
     */
    packMessages() {
        const thoughts = [];
        let textResponse = null;
        for (let msg of this.messages) {
            if (msg.type !== 'statusResponse') {
                textResponse = msg.content;
            }
            else {
                thoughts.push(msg.content);
            }
        }
        return { thoughts, textResponse: textResponse || '' };
    }
}
() => ;
() => {
    return new Promise(resolve => {
        this.once('closed', () => resolve(this.packMessages()));
    });
};
/**
 * Streams the events with `writeResponseChunk` over HTTP chunked encoding
 * and returns on the close event emission.
 * ----------
 * DevNote: Agents do not stream so in here we are simply
 * emitting the thoughts and text response as soon as we get them.
 * @param {import("express").Response} response
 * @param {string} uuid - Unique identifier that is the same across chunks.
 * @returns {Promise<{thoughts: string[], textResponse: string}>}
 */
async;
streamAgentEvents();
Promise();
Promise(response, uuid);
{
    const onChunkHandler = (data) => {
        if (data.type === 'statusResponse') {
            return (0, responses_1.writeResponseChunk)(response, {
                id: uuid,
                type: 'agentThought',
                thought: data.content,
                sources: [],
                attachments: [],
                close: false,
                error: null,
            });
        }
        return (0, responses_1.writeResponseChunk)(response, {
            id: uuid,
            type: 'textResponse',
            textResponse: data.content,
            sources: [],
            attachments: [],
            close: true,
            error: null,
        });
    };
    this.on('chunk', onChunkHandler);
    // Wait for close and after remove chunk listener
    return this.waitForClose().then(closedResponse => {
        this.removeListener('chunk', onChunkHandler);
        return closedResponse;
    });
}
async * [Symbol.asyncIterator]();
Promise();
Promise();
{
    while (true) {
        if (this.messages.length > 0) {
            yield this.messages.shift();
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for new messages
    }
}
exports.EphemeralEventListener = EphemeralEventListener;
export {};
//# sourceMappingURL=ephemeral.js.map