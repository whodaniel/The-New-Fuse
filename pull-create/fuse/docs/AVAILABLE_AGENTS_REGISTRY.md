# Available AI Agents Registry - Current Network Inventory

## 🤖 VS Code Extension Agents (Direct Code Implementation)

### Agent Capabilities: Direct file writing, code modification, MCP access, chat interfaces

1. **Cline (Claude Coder)**
   - **Type**: VS Code Extension Agent
   - **Capabilities**: Direct code implementation, file operations, MCP integration
   - **Interface**: Chat interface within VS Code
   - **Access Method**: Already available in open VS Code instance
   - **Best For**: Complex coding tasks, file manipulation, system integration

2. **RooCoder** 
   - **Type**: VS Code Extension Agent
   - **Capabilities**: Code generation, direct file writing, MCP access
   - **Interface**: Chat interface within VS Code
   - **Access Method**: Available in current VS Code instance
   - **Best For**: Code implementation, debugging, development tasks

3. **Gemini Code Assist Coder**
   - **Type**: VS Code Extension Agent
   - **Capabilities**: AI-powered coding assistance, direct implementation
   - **Interface**: Integrated VS Code chat
   - **Access Method**: Active in current VS Code
   - **Best For**: Code suggestions, implementation, Google ecosystem integration

4. **Copilot Extension Coder**
   - **Type**: VS Code Extension Agent  
   - **Capabilities**: GitHub Copilot integration, code completion, chat
   - **Interface**: VS Code integrated chat and autocomplete
   - **Access Method**: Available in open VS Code
   - **Best For**: Code completion, GitHub integration, rapid development

## 🌐 Chrome Browser Agents (Advisory & Artifact Creation)

### Agent Capabilities: Code suggestions, artifacts, screen reading, image generation

5. **Gemini (Google)**
   - **URL**: https://gemini.google.com/app
   - **Type**: Browser-based AI Agent
   - **Capabilities**: 
     - Code artifact creation
     - Image generation
     - Real-time screen share reading
     - Multi-modal analysis
   - **Interface**: Web chat interface
   - **Best For**: Complex analysis, visual content, real-time screen assistance

6. **AI Studio (Google)**
   - **URL**: https://aistudio.google.com/app/prompts/new_chat
   - **Type**: Browser-based Multi-LLM Platform
   - **Capabilities**:
     - Multiple LLM access
     - Code artifact creation
     - Advanced prompting
     - Model comparison
   - **Interface**: Web-based prompt interface
   - **Best For**: Model experimentation, advanced prompting, comparative analysis

7. **Jules (Google) - ⭐ CRITICAL AGENT**
   - **URL**: https://jules.google.com/
   - **Type**: Agentic GitHub-Integrated Coder
   - **Capabilities**:
     - Direct GitHub repository coding
     - Connected to user's GitHub account
     - Repository selection interface
     - State-of-the-art agentic coding
     - Direct commit and branch creation
   - **⚠️ COORDINATION REQUIREMENTS**:
     - Track all commits and branches created
     - Coordinate with local development work
     - Organize GitHub integration carefully
     - Monitor for branch conflicts
     - Ensure proper pull/push coordination
   - **Best For**: Large-scale coding projects, GitHub integration, repository-wide changes

8. **GitHub Copilot (Web)**
   - **Location**: GitHub website, top-right button
   - **Type**: Repository-Integrated AI Assistant
   - **Capabilities**:
     - Direct repository file access
     - Code suggestions within GitHub context
     - Repository-aware assistance
   - **Interface**: GitHub web interface integration
   - **Best For**: Repository analysis, GitHub-native development assistance

9. **Claude (Web) - Secondary Instance**
   - **URL**: https://claude.ai/new
   - **Type**: Browser-based Claude Instance
   - **Capabilities**: Full Claude capabilities via web interface
   - **⚠️ USAGE NOTE**: Consumes daily usage limits faster
   - **Interface**: Web chat interface
   - **Best For**: Overflow capacity, parallel processing (use strategically)

## 🎯 Agent Coordination Strategy

### High-Priority Coordination Requirements

#### Jules GitHub Agent - Critical Management
- **Risk**: Uncoordinated commits can conflict with local work
- **Solution**: Establish branch naming conventions and commit tracking
- **Protocol**: Always coordinate Jules work with local development
- **Monitoring**: Track all repository changes made by Jules

#### VS Code Agents - Direct Implementation
- **Strategy**: Delegate specific coding tasks with clear requirements
- **Advantage**: Can directly modify files without manual copy-paste
- **Best Use**: Implementation of designed solutions, file operations

#### Browser Agents - Advisory Role
- **Strategy**: Use for planning, analysis, and suggestions
- **Limitation**: Cannot directly implement (except Jules)
- **Best Use**: Architecture decisions, code review, problem-solving

## 📊 Agent Database Schema Requirements

### Per-User Agent Registry
```sql
CREATE TABLE user_agents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  agent_type ENUM('vscode_extension', 'browser_based', 'github_integrated'),
  capabilities JSON,
  access_url VARCHAR(500),
  interface_type VARCHAR(100),
  status ENUM('active', 'inactive', 'unavailable'),
  last_used TIMESTAMP,
  favorite BOOLEAN DEFAULT FALSE,
  performance_rating INTEGER DEFAULT 0,
  specializations TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_task_assignments (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES user_agents(id),
  task_description TEXT,
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status ENUM('assigned', 'in_progress', 'completed', 'failed'),
  result_summary TEXT,
  coordination_notes TEXT
);

CREATE TABLE agent_capabilities (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES user_agents(id),
  capability_name VARCHAR(255),
  capability_level ENUM('basic', 'intermediate', 'advanced', 'expert'),
  verified_at TIMESTAMP
);
```

### Coordination Tracking
```sql
CREATE TABLE github_coordination (
  id UUID PRIMARY KEY,
  agent_name VARCHAR(255),
  repository VARCHAR(255),
  branch_name VARCHAR(255),
  commit_hash VARCHAR(255),
  action_type ENUM('commit', 'branch_create', 'pull_request'),
  coordinated_with_local BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Discovery Protocol for Master Orchestrator

### Phase 1: VS Code Agent Discovery
1. Scan VS Code extensions for chat interfaces
2. Test MCP connectivity for each agent
3. Assess coding capabilities through test tasks
4. Document response patterns and specializations

### Phase 2: Browser Agent Verification
1. Verify access to each listed URL
2. Test artifact creation capabilities
3. Assess real-time interaction features
4. Document unique capabilities per agent

### Phase 3: GitHub Integration Assessment
1. **Jules**: Test repository access and coding capabilities
2. **GitHub Copilot**: Verify repository integration
3. Establish coordination protocols for GitHub work
4. Create branch management workflows

### Phase 4: Capability Mapping
1. Create detailed capability matrix
2. Identify optimal task assignments per agent
3. Establish delegation protocols
4. Document coordination requirements

## ⚠️ Critical Coordination Notes

### Jules GitHub Agent Management
- **ALWAYS** coordinate Jules commits with local development
- Establish clear branch naming: `jules/feature-name` or `jules/task-description`
- Monitor repository for unexpected changes
- Implement pull request workflows for Jules contributions
- Track all commits to prevent conflicts

### Token Usage Optimization
- Delegate implementation tasks to VS Code agents
- Use browser agents for planning and analysis
- Reserve Master Orchestrator context for high-level coordination
- Use secondary Claude instance only when necessary

### Multi-Agent Workflow
1. **Planning**: Browser agents (Gemini, AI Studio)
2. **Implementation**: VS Code agents (Cline, RooCoder, etc.)
3. **GitHub Integration**: Jules + coordination protocols
4. **Orchestration**: Master Orchestrator (primary Claude)

This registry provides the foundation for the Master Orchestrator to immediately begin coordinating a sophisticated multi-agent development environment while maintaining proper oversight and coordination protocols.
