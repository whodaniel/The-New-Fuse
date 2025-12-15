import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export interface DebatePosition {
  agentId: string;
  position: string;
  arguments: string[];
  evidence: string[];
  confidence: number;
}

export interface DebateResult {
  winner: string;
  consensus: string;
  reasoning: string;
  participantScores: Record<string, number>;
}

export interface Debate {
  id: string;
  topic: string;
  participants: string[];
  rounds: number;
  currentRound: number;
  status: 'INITIALIZED' | 'IN_PROGRESS' | 'COMPLETED';
  positions: Record<string, DebatePosition[]>;
  result: DebateResult | null;
  rules?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DebateService {
  private readonly logger = new Logger(DebateService.name);
  private debates: Map<string, Debate> = new Map();

  /**
   * Initialize a debate between agents
   */
  async initializeDebate(
    topic: string,
    participants: string[],
    rules?: any
  ): Promise<string> {
    this.logger.log(`Initializing debate on topic: ${topic}`);
    
    const debateId = `debate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const debate: Debate = {
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
    participants.forEach(p => {
      debate.positions[p] = [];
    });

    this.debates.set(debateId, debate);
    
    return debateId;
  }

  /**
   * Submit a position for debate
   */
  async submitPosition(
    debateId: string,
    position: DebatePosition
  ): Promise<void> {
    this.logger.log(`Position submitted for debate ${debateId} by agent ${position.agentId}`);
    
    const debate = this.debates.get(debateId);
    if (!debate) {
      throw new NotFoundException(`Debate not found: ${debateId}`);
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
  async evaluateDebate(
    debateId: string,
    positions: DebatePosition[] // Optional override, usually we use stored positions
  ): Promise<DebateResult> {
    this.logger.log(`Evaluating debate ${debateId}`);
    
    const debate = this.debates.get(debateId);
    if (!debate) {
        // If debate doesn't exist but positions are provided, we can still evaluate ad-hoc
         if (positions && positions.length > 0) {
            return this.simpleEvaluation(positions);
         }
        throw new NotFoundException(`Debate not found: ${debateId}`);
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

  private simpleEvaluation(positions: DebatePosition[]): DebateResult {
    // Simple evaluation logic: highest confidence wins
    // In a real system, this would use an LLM to evaluate arguments

    let winner = 'unknown';
    let maxScore = -1;
    const scores: Record<string, number> = {};

    positions.forEach(p => {
        // Simple score calculation
        const score = p.confidence * (1 + (p.evidence.length * 0.1) + (p.arguments.length * 0.1));
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
        consensus: positions.length > 1 ? 'Majority decision based on confidence and evidence' : 'Single participant submission',
        reasoning: 'Evaluation based on argument strength (confidence) and quantity of evidence provided.',
        participantScores: scores
    };
  }

  /**
   * Facilitate multi-round debate
   */
  async facilitateMultiRoundDebate(
    topic: string,
    participants: string[],
    rounds: number = 3
  ): Promise<DebateResult> {
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

    const result: DebateResult = {
      winner: 'pending',
      consensus: 'Debate initialized, waiting for rounds execution',
      reasoning: 'Multi-round debate started. External orchestration required.',
      participantScores: {}
    };

    return result;
  }

  /**
   * Get debate by ID
   */
  async getDebate(debateId: string): Promise<Debate | undefined> {
    return this.debates.get(debateId);
  }
}
