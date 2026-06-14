"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DebateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebateService = void 0;
const common_1 = require("@nestjs/common");
let DebateService = DebateService_1 = class DebateService {
    constructor() {
        this.logger = new common_1.Logger(DebateService_1.name);
        this.debates = new Map();
    }
    /**
     * Initialize a debate between agents
     */
    async initializeDebate(topic, participants, rules) {
        this.logger.log(`Initializing debate on topic: ${topic}`);
        const debateId = `debate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const debate = {
            id: debateId,
            topic,
            participants,
            rounds: rules?.rounds || 3,
            currentRound: 0,
            status: 'INITIALIZED',
            positions: {},
            result: null,
            rules,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Initialize positions array for each participant
        participants.forEach((p) => {
            debate.positions[p] = [];
        });
        this.debates.set(debateId, debate);
        return debateId;
    }
    /**
     * Submit a position for debate
     */
    async submitPosition(debateId, position) {
        this.logger.log(`Position submitted for debate ${debateId} by agent ${position.agentId}`);
        const debate = this.debates.get(debateId);
        if (!debate) {
            throw new common_1.NotFoundException(`Debate not found: ${debateId}`);
        }
        if (!debate.participants.includes(position.agentId)) {
            throw new Error(`Agent ${position.agentId} is not a participant in debate ${debateId}`);
        }
        if (!debate.positions[position.agentId]) {
            debate.positions[position.agentId] = [];
        }
        debate.positions[position.agentId].push(position);
        debate.updatedAt = new Date();
        debate.status = 'IN_PROGRESS';
        this.debates.set(debateId, debate);
    }
    /**
     * Evaluate debate and determine result
     */
    async evaluateDebate(debateId, positions // Optional override, usually we use stored positions
    ) {
        this.logger.log(`Evaluating debate ${debateId}`);
        const debate = this.debates.get(debateId);
        if (!debate) {
            // If debate doesn't exist but positions are provided, we can still evaluate ad-hoc
            if (positions && positions.length > 0) {
                return this.simpleEvaluation(positions);
            }
            throw new common_1.NotFoundException(`Debate not found: ${debateId}`);
        }
        // Collect all positions if not provided
        let allPositions = positions;
        if (!allPositions || allPositions.length === 0) {
            allPositions = Object.values(debate.positions).flat();
        }
        const result = this.simpleEvaluation(allPositions);
        debate.result = result;
        debate.status = 'COMPLETED';
        debate.updatedAt = new Date();
        this.debates.set(debateId, debate);
        return result;
    }
    simpleEvaluation(positions) {
        // Simple evaluation logic: highest confidence wins
        // In a real system, this would use an LLM to evaluate arguments
        let winner = 'unknown';
        let maxScore = -1;
        const scores = {};
        positions.forEach((p) => {
            // Simple score calculation
            const score = p.confidence * (1 + p.evidence.length * 0.1 + p.arguments.length * 0.1);
            scores[p.agentId] = (scores[p.agentId] || 0) + score;
        });
        // Find winner based on aggregated scores
        for (const [agentId, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                winner = agentId;
            }
        }
        return {
            winner,
            consensus: positions.length > 1
                ? 'Majority decision based on confidence and evidence'
                : 'Single participant submission',
            reasoning: 'Evaluation based on argument strength (confidence) and quantity of evidence provided.',
            participantScores: scores,
        };
    }
    /**
     * Facilitate multi-round debate
     */
    async facilitateMultiRoundDebate(topic, participants, rounds = 3) {
        this.logger.log(`Facilitating ${rounds}-round debate on: ${topic}`);
        const debateId = await this.initializeDebate(topic, participants, { rounds });
        // Note: In a real implementation, this method would orchestrate calls to the agents
        // to get their positions for each round.
        // Since we don't have access to the agent execution layer here, we assume
        // the orchestration happens externally or we return the initialized debate ID
        // for an external coordinator to handle.
        // For now, we'll mark it as initialized and return a placeholder result
        // as if it was completed (or we should throw/wait).
        // To match the interface contract which returns DebateResult immediately (implying synchronous execution or awaiting all rounds),
        // we would need to actually run the loop.
        // However, without being able to call agents, we can't really "facilitate" it fully.
        // I will return a result indicating it needs external orchestration or just return what we have.
        // Let's create a result based on empty positions since we can't drive the agents.
        const result = {
            winner: 'pending',
            consensus: 'Debate initialized, waiting for rounds execution',
            reasoning: 'Multi-round debate started. External orchestration required.',
            participantScores: {},
        };
        return result;
    }
    /**
     * Get debate by ID
     */
    async getDebate(debateId) {
        return this.debates.get(debateId);
    }
};
exports.DebateService = DebateService;
exports.DebateService = DebateService = DebateService_1 = __decorate([
    (0, common_1.Injectable)()
], DebateService);
//# sourceMappingURL=debate.service.js.map