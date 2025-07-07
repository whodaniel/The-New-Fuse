import { NLPEngine } from './NLPEngine';
export declare class VoiceEngine {
    private nlpEngine;
    private recognition;
    private synthesis;
    private isListening;
    private commandHandlers;
    private commandHistory;
    private contextState;
    constructor(nlpEngine: NLPEngine);
    private executeCommand;
}
