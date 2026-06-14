"use strict";
/**
 * Brand Consistency Agent Controller
 *
 * Exposes REST endpoints for the self-improving Brand Consistency Agent.
 * This agent analyzes components for brand consistency and evolves its
 * detection capabilities over time.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BrandConsistencyController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandConsistencyController = void 0;
const common_1 = require("@nestjs/common");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const brand_consistency_agent_service_1 = require("./brand-consistency-agent.service");
let BrandConsistencyController = BrandConsistencyController_1 = class BrandConsistencyController {
    constructor(agentService) {
        this.agentService = agentService;
        this.logger = new common_1.Logger(BrandConsistencyController_1.name);
    }
    /**
     * Get agent information and current state
     */
    getAgentInfo() {
        return this.agentService.getAgentInfo();
    }
    /**
     * Analyze a component for brand consistency
     */
    async analyzeComponent(body) {
        this.logger.log(`Analyzing component: ${body.componentPath}`);
        return this.agentService.analyzeComponent(body.componentPath, body.componentCode);
    }
    /**
     * Provide feedback for self-improvement
     */
    async provideFeedback(body) {
        await this.agentService.selfImprove(body);
        return { success: true, message: 'Feedback processed for self-improvement' };
    }
    /**
     * Get analysis summary across all analyzed components
     */
    getAnalysisSummary() {
        return this.agentService.getAnalysisSummary();
    }
    /**
     * Generate brand CSS variables and utilities
     */
    getBrandCSS() {
        return {
            css: this.agentService.generateBrandCSS(),
            contentType: 'text/css',
        };
    }
    /**
     * Analyze multiple components at once
     */
    async analyzeBatch(body) {
        const results = [];
        for (const component of body.components) {
            const analysis = await this.agentService.analyzeComponent(component.path, component.code);
            results.push(analysis);
        }
        return {
            totalComponents: results.length,
            results,
            summary: this.agentService.getAnalysisSummary(),
        };
    }
    /**
     * Run a demonstration of the agent's capabilities
     */
    async runDemo() {
        this.logger.log('Running Brand Consistency Agent Demo');
        // Sample component code with various brand issues
        const sampleCode = `
// Sample React Component with brand inconsistencies
import React from 'react';

const DemoCard = () => {
  return (
    <div style={{
      background: '#1a1a2e',       // Non-brand background color
      borderRadius: '8px',         // Should be 0.5rem
      padding: '15px',             // Not on 4px grid
      fontFamily: 'Arial',         // Non-brand font
      transition: 'all 0.3s ease'  // Non-standard duration
    }}>
      <h2 style={{
        color: '#e94560',          // Non-brand color
        fontSize: '24px'           // Should use rem scale
      }}>
        Demo Title
      </h2>
      <button style={{
        background: '#16213e',     // Should use gradient
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px'
      }}>
        Click Me
      </button>
    </div>
  );
};

export default DemoCard;
    `.trim();
        // Analyze the sample
        const analysis = await this.agentService.analyzeComponent('src/components/DemoCard.tsx', sampleCode);
        // Simulate learning from the analysis
        await this.agentService.selfImprove({
            issueType: 'color',
            wasHelpful: true,
            learnedPattern: 'Detect non-brand gradient backgrounds in buttons',
        });
        return {
            message: 'Brand Consistency Agent Demo Complete',
            analysis,
            agentInfo: this.agentService.getAgentInfo(),
            brandCSS: this.agentService.generateBrandCSS(),
        };
    }
};
exports.BrandConsistencyController = BrandConsistencyController;
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrandConsistencyController.prototype, "getAgentInfo", null);
__decorate([
    (0, common_1.Post)('analyze'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandConsistencyController.prototype, "analyzeComponent", null);
__decorate([
    (0, common_1.Post)('feedback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandConsistencyController.prototype, "provideFeedback", null);
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrandConsistencyController.prototype, "getAnalysisSummary", null);
__decorate([
    (0, common_1.Get)('brand-css'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrandConsistencyController.prototype, "getBrandCSS", null);
__decorate([
    (0, common_1.Post)('analyze-batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandConsistencyController.prototype, "analyzeBatch", null);
__decorate([
    (0, common_1.Post)('demo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrandConsistencyController.prototype, "runDemo", null);
exports.BrandConsistencyController = BrandConsistencyController = BrandConsistencyController_1 = __decorate([
    (0, common_1.Controller)('agents/brand-consistency'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    __metadata("design:paramtypes", [brand_consistency_agent_service_1.BrandConsistencyAgentService])
], BrandConsistencyController);
//# sourceMappingURL=brand-consistency.controller.js.map