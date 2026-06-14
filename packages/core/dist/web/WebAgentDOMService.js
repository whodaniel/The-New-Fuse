var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebAgentDOMService_1;
import { Injectable, Logger } from '@nestjs/common';
let WebAgentDOMService = WebAgentDOMService_1 = class WebAgentDOMService {
    constructor() {
        this.logger = new Logger(WebAgentDOMService_1.name);
        this.snapshots = new Map();
        this.actionLog = [];
    }
    minifySnapshot(snapshot) {
        const minifiedNodes = snapshot.nodes.map((node) => ({
            id: node.id,
            tagName: node.tagName,
            attributes: Object.fromEntries(Object.entries(node.attributes).filter(([key]) => ['id', 'class', 'href', 'src', 'type', 'name', 'value', 'placeholder', 'role', 'aria-label'].includes(key))),
            textContent: node.textContent.slice(0, 200),
            children: node.children,
            interactable: node.interactable,
            rect: node.interactable ? node.rect : null,
            visibility: node.visibility,
        }));
        return {
            ...snapshot,
            nodes: minifiedNodes,
            metadata: {
                totalNodes: minifiedNodes.length,
                interactableCount: minifiedNodes.filter((n) => n.interactable).length,
                snapshotSizeBytes: JSON.stringify(minifiedNodes).length,
            },
        };
    }
    determineAction(snapshot, goal) {
        const interactable = snapshot.nodes.filter((n) => n.interactable && n.visibility === 'visible');
        const goalLower = goal.toLowerCase();
        const searchInputs = interactable.filter((n) => n.tagName === 'input' &&
            (n.attributes.type === 'search' || n.attributes.role === 'searchbox' || n.attributes.name?.includes('search') || n.attributes.placeholder?.toLowerCase().includes('search')));
        const loginButtons = interactable.filter((n) => (n.tagName === 'button' || n.tagName === 'a') &&
            (n.textContent.toLowerCase().includes('login') || n.textContent.toLowerCase().includes('sign in') || n.attributes.href?.includes('login')));
        const submitButtons = interactable.filter((n) => n.tagName === 'button' &&
            (n.attributes.type === 'submit' || n.textContent.toLowerCase().includes('submit')));
        const links = interactable.filter((n) => n.tagName === 'a' && n.attributes.href);
        if (goalLower.includes('search') && searchInputs.length > 0) {
            const query = goalLower.replace(/search\s*(for)?/i, '').trim();
            return {
                type: 'type',
                targetNodeId: searchInputs[0].id,
                value: query,
                description: `Type '${query}' into search input`,
                confidence: 0.85,
            };
        }
        if (goalLower.includes('login') && loginButtons.length > 0) {
            return {
                type: 'click',
                targetNodeId: loginButtons[0].id,
                description: `Click login button`,
                confidence: 0.8,
            };
        }
        if (goalLower.includes('submit') && submitButtons.length > 0) {
            return {
                type: 'click',
                targetNodeId: submitButtons[0].id,
                description: `Click submit button`,
                confidence: 0.8,
            };
        }
        if (goalLower.includes('click') || goalLower.includes('navigate')) {
            const targetText = goalLower.replace(/click\s*(on)?|navigate\s*(to)?/i, '').trim();
            const match = interactable.find((n) => n.textContent.toLowerCase().includes(targetText));
            if (match) {
                return {
                    type: 'click',
                    targetNodeId: match.id,
                    description: `Click element with text '${targetText}'`,
                    confidence: 0.7,
                };
            }
        }
        if (links.length > 0) {
            const relevantLink = links.find((n) => n.textContent.toLowerCase().includes(goalLower.split(' ')[0]));
            if (relevantLink) {
                return {
                    type: 'click',
                    targetNodeId: relevantLink.id,
                    description: `Click link: ${relevantLink.textContent.slice(0, 50)}`,
                    confidence: 0.5,
                };
            }
        }
        return {
            type: 'wait',
            targetNodeId: '',
            description: `No clear action found for goal: ${goal}`,
            confidence: 0,
        };
    }
    executeAction(action, snapshotId) {
        const snapshot = this.snapshots.get(snapshotId);
        const result = {
            action,
            success: false,
            snapshotBefore: snapshotId,
            timestamp: new Date().toISOString(),
        };
        if (!action.targetNodeId && action.type !== 'wait' && action.type !== 'navigate') {
            result.error = `No target node specified for action type: ${action.type}`;
            return result;
        }
        if (action.confidence < 0.3) {
            result.error = `Action confidence too low: ${action.confidence}`;
            return result;
        }
        this.logger.log(`Executing action: ${action.type} on ${action.targetNodeId} — ${action.description}`);
        result.success = true;
        this.actionLog.push(result);
        return result;
    }
    storeSnapshot(snapshot) {
        const id = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        this.snapshots.set(id, snapshot);
        this.logger.debug(`Stored DOM snapshot: ${id} (${snapshot.metadata.totalNodes} nodes)`);
        return id;
    }
    getSnapshot(id) {
        return this.snapshots.get(id);
    }
    getActionLog() {
        return [...this.actionLog];
    }
    clearHistory() {
        this.snapshots.clear();
        this.actionLog.length = 0;
    }
};
WebAgentDOMService = WebAgentDOMService_1 = __decorate([
    Injectable()
], WebAgentDOMService);
export { WebAgentDOMService };
//# sourceMappingURL=WebAgentDOMService.js.map