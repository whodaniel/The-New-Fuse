var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GenesisPOMLEnhancerService_1;
import { Injectable, Logger } from '@nestjs/common';
/**
 * Genesis POML Enhancer Service
 *
 * Enhances the Genesis Agent's capability to generate POML-native agent definitions.
 * This service provides the Genesis Agent with specialized prompts and templates
 * for creating high-quality, structured POML templates.
 */
let GenesisPOMLEnhancerService = GenesisPOMLEnhancerService_1 = class GenesisPOMLEnhancerService {
    logger = new Logger(GenesisPOMLEnhancerService_1.name);
    /**
     * Generate a SystemBlueprint with POML-native agents
     */
    async generatePOMLNativeSystemBlueprint(userGoal, targetDomain = 'general', complexity = 'moderate') {
        this.logger.log(`Generating POML-native system blueprint for goal: ${userGoal}`);
        // This would be where the Genesis Agent's master prompt is enhanced
        // For now, we'll create a structured example of what the Genesis Agent should generate
        const agents = await this.generatePOMLNativeAgents(userGoal, targetDomain, complexity);
        const workflow = await this.generateWorkflowForAgents(agents, userGoal);
        return {
            new_agents_to_create: agents,
            workflow: workflow
        };
    }
    /**
     * Generate POML-native agent definitions based on user goal
     */
    async generatePOMLNativeAgents(userGoal, domain, complexity) {
        const agents = [];
        // Generate agents based on complexity level
        switch (complexity) {
            case 'simple':
                agents.push(await this.createSinglePurposeAgent(userGoal, domain));
                break;
            case 'moderate':
                agents.push(await this.createInputProcessorAgent(userGoal, domain), await this.createAnalysisAgent(userGoal, domain), await this.createOutputFormatterAgent(userGoal, domain));
                break;
            case 'complex':
                agents.push(await this.createValidatorAgent(userGoal, domain), await this.createResearchAgent(userGoal, domain), await this.createAnalysisAgent(userGoal, domain), await this.createSynthesisAgent(userGoal, domain), await this.createQualityAssuranceAgent(userGoal, domain));
                break;
        }
        return agents;
    }
    /**
     * Create a single-purpose POML agent (for simple workflows)
     */
    async createSinglePurposeAgent(goal, domain) {
        const agentName = `${domain}_processor_agent`;
        return {
            agent_name: agentName,
            description: `Processes ${domain} requests to achieve: ${goal}`,
            persona: '', // Will be replaced by POML template
            output_schema_code: `class ProcessorOutput(BaseModel): 
    result: str
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = {}`,
            parsing_grammar: '', // Will be less important with POML
            parsing_strategy: undefined, // Default will be used
            // POML v2.0 Fields
            poml_template: {
                template_name: `${agentName}_template`,
                template_content: `<poml>
  <role>
    You are a specialized AI agent for ${domain} processing.
    Your expertise lies in ${goal.toLowerCase()}.
  </role>
  
  <task>
    Analyze the provided input and generate a comprehensive response.
    Focus on accuracy, clarity, and actionable insights.
    
    Input Data: {{input_data}}
    Context: {{context}}
  </task>
  
  <output-schema>
  {
    "type": "object",
    "properties": {
      "result": {
        "type": "string",
        "description": "The main processing result"
      },
      "confidence": {
        "type": "number",
        "minimum": 0.0,
        "maximum": 1.0,
        "description": "Confidence score for the result"
      },
      "metadata": {
        "type": "object",
        "description": "Additional metadata about the processing"
      }
    },
    "required": ["result", "confidence"]
  }
  </output-schema>
  
  <example>
    Input: "Sample ${domain} data"
    Output: {
      "result": "Processed sample data with insights",
      "confidence": 0.85,
      "metadata": {"processing_method": "${domain}_analysis"}
    }
  </example>
  
  <stylesheet>
    format: structured_json
    verbosity: detailed
    tone: professional
  </stylesheet>
</poml>`,
                data_bindings: {
                    'input_data': 'workflow_input.data',
                    'context': 'workflow_context.environment'
                },
                hint_metadata: {
                    created_by: 'genesis_agent',
                    agent_type: 'single_purpose',
                    domain: domain,
                    goal: goal,
                    version: '2.0.0'
                }
            },
            enable_poml_rendering: true,
            hint_validation_enabled: true
        };
    }
    /**
     * Create an input processor agent (for moderate/complex workflows)
     */
    async createInputProcessorAgent(goal, domain) {
        const agentName = `${domain}_input_processor`;
        return {
            agent_name: agentName,
            description: `Validates and preprocesses input data for ${domain} workflows`,
            persona: '',
            output_schema_code: `class InputProcessorOutput(BaseModel):
    validated_input: Dict[str, Any]
    validation_status: str
    preprocessing_notes: List[str] = []`,
            parsing_grammar: '',
            poml_template: {
                template_name: `${agentName}_template`,
                template_content: `<poml>
  <role>
    You are an input validation and preprocessing specialist for ${domain} systems.
    Your role is to ensure data quality and consistency before downstream processing.
  </role>
  
  <task>
    1. Validate the incoming data structure and content
    2. Perform necessary preprocessing and normalization  
    3. Flag any issues or inconsistencies
    4. Prepare clean, structured data for downstream agents
    
    Raw Input: {{raw_input}}
    Expected Schema: {{expected_schema}}
  </task>
  
  <output-schema>
  {
    "type": "object",
    "properties": {
      "validated_input": {
        "type": "object",
        "description": "Clean, validated input data"
      },
      "validation_status": {
        "type": "string",
        "enum": ["valid", "valid_with_warnings", "invalid"],
        "description": "Overall validation result"
      },
      "preprocessing_notes": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Notes about preprocessing steps taken"
      }
    },
    "required": ["validated_input", "validation_status"]
  }
  </output-schema>
  
  <example>
    Input: {"raw_data": "example", "format": "json"}
    Output: {
      "validated_input": {"processed_data": "example", "format": "json", "timestamp": "2024-01-01"},
      "validation_status": "valid",
      "preprocessing_notes": ["Added timestamp", "Normalized format"]
    }
  </example>
</poml>`,
                data_bindings: {
                    'raw_input': 'workflow_input.data',
                    'expected_schema': 'workflow_config.input_schema'
                }
            },
            enable_poml_rendering: true,
            hint_validation_enabled: true
        };
    }
    /**
     * Create an analysis agent (core processing agent)
     */
    async createAnalysisAgent(goal, domain) {
        const agentName = `${domain}_analyst`;
        return {
            agent_name: agentName,
            description: `Core analysis agent for ${domain} data processing`,
            persona: '',
            output_schema_code: `class AnalysisOutput(BaseModel):
    analysis_results: Dict[str, Any]
    insights: List[str]
    confidence_metrics: Dict[str, float]
    recommendations: List[str] = []`,
            parsing_grammar: '',
            poml_template: {
                template_name: `${agentName}_template`,
                template_content: `<poml>
  <role>
    You are a senior ${domain} analyst with deep expertise in data interpretation and insight generation.
    Your analysis should be thorough, objective, and actionable.
  </role>
  
  <task>
    Perform comprehensive analysis on the provided data to achieve: ${goal}
    
    1. Analyze patterns and trends in the data
    2. Extract key insights and findings  
    3. Generate confidence metrics for your analysis
    4. Provide actionable recommendations
    
    Validated Input: {{validated_input}}
    Analysis Context: {{analysis_context}}
    
    <document src="file://context/domain_knowledge.txt">Domain Knowledge Base</document>
  </task>
  
  <output-schema>
  {
    "type": "object",
    "properties": {
      "analysis_results": {
        "type": "object",
        "description": "Detailed analysis findings"
      },
      "insights": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Key insights discovered"
      },
      "confidence_metrics": {
        "type": "object",
        "description": "Confidence scores for different aspects"
      },
      "recommendations": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Actionable recommendations"
      }
    },
    "required": ["analysis_results", "insights", "confidence_metrics"]
  }
  </output-schema>
  
  <tool-definition>
  {
    "name": "statistical_analysis",
    "description": "Perform statistical analysis on numerical data",
    "parameters": {
      "type": "object",
      "properties": {
        "data": {"type": "array"},
        "analysis_type": {"type": "string", "enum": ["descriptive", "correlation", "regression"]}
      }
    }
  }
  </tool-definition>
</poml>`,
                data_bindings: {
                    'validated_input': 'step_data.input_processor.validated_input',
                    'analysis_context': 'workflow_context.domain_context'
                }
            },
            enable_poml_rendering: true,
            hint_validation_enabled: true,
            data_components: [
                {
                    component_name: 'domain_knowledge',
                    data_source: 'file://knowledge_base/domain_specific.txt',
                    resolver_config: { 'cache_ttl_seconds': 3600 },
                    validation_hints: ['Ensure knowledge base is current', 'Validate domain relevance']
                }
            ]
        };
    }
    /**
     * Create an output formatter agent
     */
    async createOutputFormatterAgent(goal, domain) {
        const agentName = `${domain}_output_formatter`;
        return {
            agent_name: agentName,
            description: `Formats and presents final output for ${domain} workflows`,
            persona: '',
            output_schema_code: `class FormattedOutput(BaseModel):
    formatted_result: str
    presentation_format: str
    summary: str
    export_formats: List[str] = []`,
            parsing_grammar: '',
            poml_template: {
                template_name: `${agentName}_template`,
                template_content: `<poml>
  <role>
    You are a presentation specialist who transforms technical analysis into clear,
    actionable outputs tailored to the intended audience.
  </role>
  
  <task>
    Format the analysis results into a professional, user-friendly presentation.
    
    1. Create a clear summary of key findings
    2. Format detailed results appropriately
    3. Ensure accessibility and clarity
    4. Prepare multiple export formats if needed
    
    Analysis Results: {{analysis_results}}
    Target Audience: {{target_audience}}
    Presentation Requirements: {{presentation_requirements}}
  </task>
  
  <output-schema>
  {
    "type": "object",
    "properties": {
      "formatted_result": {
        "type": "string",
        "description": "Main formatted output"
      },
      "presentation_format": {
        "type": "string",
        "enum": ["markdown", "html", "json", "csv"],
        "description": "Primary presentation format"
      },
      "summary": {
        "type": "string",
        "description": "Executive summary of results"
      },
      "export_formats": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Additional available export formats"
      }
    },
    "required": ["formatted_result", "presentation_format", "summary"]
  }
  </output-schema>
  
  <stylesheet>
    format: clean_structured
    verbosity: executive_summary
    tone: professional_accessible
    include_metadata: false
  </stylesheet>
</poml>`,
                data_bindings: {
                    'analysis_results': 'step_data.analyst.analysis_results',
                    'target_audience': 'workflow_config.target_audience',
                    'presentation_requirements': 'workflow_config.presentation'
                }
            },
            enable_poml_rendering: true,
            hint_validation_enabled: true
        };
    }
    /**
     * Additional agent creators for complex workflows
     */
    async createValidatorAgent(goal, domain) {
        // Implementation would follow similar pattern
        return await this.createInputProcessorAgent(goal, domain); // Placeholder
    }
    async createResearchAgent(goal, domain) {
        // Implementation would follow similar pattern  
        return await this.createAnalysisAgent(goal, domain); // Placeholder
    }
    async createSynthesisAgent(goal, domain) {
        // Implementation would follow similar pattern
        return await this.createAnalysisAgent(goal, domain); // Placeholder
    }
    async createQualityAssuranceAgent(goal, domain) {
        // Implementation would follow similar pattern
        return await this.createOutputFormatterAgent(goal, domain); // Placeholder
    }
    /**
     * Generate a workflow definition to orchestrate the created agents
     */
    async generateWorkflowForAgents(agents, goal) {
        const workflowName = `auto_generated_${goal.toLowerCase().replace(/\s+/g, '_')}_workflow`;
        const steps = agents.map((agent, index) => ({
            step_name: `step_${index + 1}_${agent.agent_name}`,
            agent_name: agent.agent_name,
            input_mapping: index === 0 ?
                { 'input_data': 'workflow_input.data' } :
                { 'input_data': `step_data.step_${index}_${agents[index - 1].agent_name}.output` },
            default_next_step: index < agents.length - 1 ? `step_${index + 2}_${agents[index + 1].agent_name}` : undefined
        }));
        return {
            workflow_name: workflowName,
            description: `Auto-generated POML-native workflow for: ${goal}`,
            start_step: steps[0].step_name,
            steps: steps
        };
    }
    /**
     * Generate enhanced Genesis Agent master prompt for POML generation
     */
    generateGenesisMasterPrompt() {
        return `
You are the Genesis Agent - an AI System Architect specialized in creating POML-native agent systems.

## Your Enhanced Mandate (POML v2.0)

You design and generate complete agentic systems using the DACC protocol enhanced with Microsoft's POML (Prompt Orchestration Markup Language). Your output is always a SystemBlueprint containing AgentDefinition objects with rich, structured POML templates.

## POML Template Design Principles

1. **Structured Semantic Components**: Always use semantic POML tags:
   - <role> - Define the agent's expertise and persona
   - <task> - Specify the agent's objectives and workflow
   - <output-schema> - Provide JSON schema hints for structured output
   - <example> - Include few-shot demonstrations
   - <stylesheet> - Define formatting and presentation rules
   - <tool-definition> - Specify available tools and functions

2. **Data Integration**: Leverage POML data components:
   - <document src="..."> for file-based knowledge
   - <table src="..."> for structured data sources
   - <folder src="..."> for document collections
   - Support URI schemes: file://, https://, cee://, db://

3. **Template Variables**: Use {{variable}} syntax for dynamic data injection
   - Map to DACC input_mapping fields
   - Support nested data access: {{step_data.previous.output}}

4. **Hint-then-Validate Pattern**: 
   - Use <output-schema> to hint at desired JSON structure
   - DACC Pydantic schemas remain the authoritative validation source
   - Balance guidance with flexibility

## Agent Generation Strategy

When given a user goal:

1. **Domain Analysis**: Identify the problem domain and complexity level
2. **Agent Decomposition**: Break the task into specialized agent roles
3. **POML Template Creation**: Design rich, structured templates for each agent
4. **Workflow Orchestration**: Connect agents with proper data flow
5. **Quality Assurance**: Ensure templates are valid and comprehensive

## Output Format

Generate a SystemBlueprint with:
- new_agents_to_create: Array of POML-enhanced AgentDefinition objects
- workflow: Complete WorkflowDefinition with proper step connections

Each AgentDefinition must include:
- Proper agent_name, description, and output_schema_code
- Rich poml_template with comprehensive POML markup
- enable_poml_rendering: true
- hint_validation_enabled: true
- data_components if external data is needed

Remember: You are creating the next generation of AI systems. Make them powerful, maintainable, and production-ready.
`;
    }
    /**
     * Health check for the service
     */
    async getHealthStatus() {
        return {
            service: 'Genesis POML Enhancer',
            status: 'healthy',
            poml_version: '2.0.0',
            agent_generation_capabilities: [
                'single_purpose_agents',
                'moderate_complexity_workflows',
                'complex_multi_agent_systems'
            ],
            supported_domains: ['general', 'data_analysis', 'content_processing', 'workflow_automation'],
            timestamp: new Date().toISOString()
        };
    }
};
GenesisPOMLEnhancerService = GenesisPOMLEnhancerService_1 = __decorate([
    Injectable()
], GenesisPOMLEnhancerService);
export { GenesisPOMLEnhancerService };
//# sourceMappingURL=genesis-poml-enhancer.service.js.map