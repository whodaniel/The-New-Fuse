"use strict";
/**
 * Agent Implementations Index
 * All agent implementations following the IAgent interface
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClineAgent = exports.InteractiveAgent = exports.CascadeAgent = exports.WorkflowAgent = exports.LLMChatAgent = exports.ResearchAgent = void 0;
var research_agent_js_1 = require("./research_agent.js");
Object.defineProperty(exports, "ResearchAgent", { enumerable: true, get: function () { return research_agent_js_1.ResearchAgent; } });
var llm_chat_agent_js_1 = require("./llm_chat_agent.js");
Object.defineProperty(exports, "LLMChatAgent", { enumerable: true, get: function () { return llm_chat_agent_js_1.LLMChatAgent; } });
var workflow_agent_js_1 = require("./workflow_agent.js");
Object.defineProperty(exports, "WorkflowAgent", { enumerable: true, get: function () { return workflow_agent_js_1.WorkflowAgent; } });
var cascade_agent_js_1 = require("./cascade_agent.js");
Object.defineProperty(exports, "CascadeAgent", { enumerable: true, get: function () { return cascade_agent_js_1.CascadeAgent; } });
var interactive_agent_js_1 = require("./interactive_agent.js");
Object.defineProperty(exports, "InteractiveAgent", { enumerable: true, get: function () { return interactive_agent_js_1.InteractiveAgent; } });
var cline_agent_js_1 = require("./cline_agent.js");
Object.defineProperty(exports, "ClineAgent", { enumerable: true, get: function () { return cline_agent_js_1.ClineAgent; } });
// Placeholder exports for remaining stubs (to be implemented)
__exportStar(require("./enhanced_agent.js"), exports);
__exportStar(require("./example_agent.js"), exports);
__exportStar(require("./simple_enhanced_agent.js"), exports);
__exportStar(require("./unified_agent.js"), exports);
//# sourceMappingURL=index.js.map