# GDesigner Integration

This integration combines our existing agent framework with GDesigner's advanced graph-based multi-agent capabilities, including experimental validation on benchmark datasets.

## Setup and Installation

1. **Install Dependencies**
```bash
# Using pip (recommended)
pip install -r requirements.txt
```

2. **Configure API Keys**
Create a `.env` file with OpenAI credentials:
```env
BASE_URL = "" # OpenAI LLM backend URL
API_KEY = "" # OpenAI API key
```

3. **Download Required Datasets**
For experimental validation, download:
- MMLU dataset
- HumanEval dataset
- GSM8K dataset

Place each dataset in its respective folder under `GDesigner-3063/datasets/`.

## Core Components

### 1. GDesigner Adapter (`gdesigner_adapter.py`)
Provides a clean interface to GDesigner's functionality:
- Graph-based agent topology management
- Specialized agents (math solver, code writer, analyzer)
- GNN-based optimization
- Task analysis capabilities

### 2. Hybrid Topology Manager (`hybrid_topology_manager.py`)
Combines our existing topology management with GDesigner's graph-based approach:
- Maintains both traditional and graph-based agent connections
- Virtual node integration for task awareness
- Dynamic topology optimization
- Communication weight management

### 3. Hybrid Agent Orchestrator (`hybrid_agent_orchestrator.py`)
Enhanced orchestration that leverages both systems:
- Task-specific topology optimization
- Specialized agent routing
- Hybrid communication management
- Context-aware task processing

### 4. GDesigner Agent Factory (`agent_factory_gdesigner.py`)
Factory for creating and configuring integrated agents:
- Creates standard and specialized agents
- Configures agent teams
- Manages agent configurations
- Handles topology initialization

### 5. System Integrator (`system_integrator.py`)
High-level interface for the integrated system:
- System initialization and configuration
- Task team creation and management
- Task processing with automatic specialization
- Resource cleanup and management

## Experimental Validation

### Running MMLU Experiments
```bash
# Full connected topology with spatial optimization
python experiments/run_mmlu.py \
    --mode FullConnected \
    --batch_size 4 \
    --agent_nums 6 \
    --num_iterations 10 \
    --num_rounds 1 \
    --optimized_spatial
```

### Running GSM8K Experiments
```bash
# Mathematical reasoning experiments
python experiments/run_gsm8k.py \
    --mode FullConnected \
    --batch_size 4 \
    --agent_nums 4 \
    --num_iterations 10 \
    --num_rounds 1 \
    --optimized_spatial
```

### Running HumanEval Experiments
```bash
# Code generation experiments
python experiments/run_humaneval.py \
    --mode FullConnected \
    --batch_size 4 \
    --agent_nums 4 \
    --num_iterations 10 \
    --num_rounds 1 \
    --optimized_spatial
```

### Experiment Parameters
- `mode`: Topology mode (FullConnected, Ring, Star)
- `batch_size`: Number of parallel tasks
- `agent_nums`: Number of agents in the system
- `num_iterations`: Iterations per experiment
- `num_rounds`: Number of experiment rounds
- `optimized_spatial`: Enable spatial topology optimization

## Usage Examples

### 1. Basic System Initialization
```python
from core.agents.integration.system_integrator import SystemIntegrator, SystemConfig

# Configure and initialize system
config = SystemConfig(
    enable_specialized_agents=True,
    enable_gnn_topology=True,
    enable_virtual_nodes=True
)
system = SystemIntegrator(config)
await system.initialize_system()
```

### 2. Creating a Task-Specific Team
```python
# Create team optimized for a specific task
team_result = await system.create_task_team(
    task_description="Implement a sorting algorithm in Python",
    required_capabilities=["programming", "algorithm_design"],
    team_size=4
)

# Access team information
team_id = team_result['team_id']
agents = team_result['agents']
topology = team_result['topology']
```

### 3. Processing a Task
```python
from core.types.task import Task

# Create and process task
task = Task(
    id="task_123",
    description="Solve complex mathematical equation",
    required_capabilities=["mathematical_reasoning"],
    type="math"
)

# Process task with existing team
result = await system.process_task(task, team_id=team_id)

# Or let system create optimal team automatically
result = await system.process_task(task)
```

### 4. Running Experiments
```python
# Configure experiment
from core.experiments.experiment_runner import ExperimentRunner

runner = ExperimentRunner(
    mode="FullConnected",
    batch_size=4,
    agent_nums=6,
    num_iterations=10,
    optimized_spatial=True
)

# Run MMLU experiment
mmlu_results = await runner.run_mmlu()

# Run GSM8K experiment
gsm8k_results = await runner.run_gsm8k()

# Run HumanEval experiment
humaneval_results = await runner.run_humaneval()
```

## Integration Benefits

1. **Enhanced Task Processing**
   - Automatic specialized agent routing
   - Graph-based topology optimization
   - Virtual node task awareness

2. **Improved Agent Collaboration**
   - GNN-based communication optimization
   - Dynamic team formation
   - Weighted connections based on task requirements

3. **Experimental Validation**
   - MMLU benchmark for knowledge evaluation
   - GSM8K for mathematical reasoning
   - HumanEval for code generation
   - Configurable experiment parameters

4. **Flexible Architecture**
   - Modular component integration
   - Configurable system behavior
   - Easy extension points

## Configuration Options

The system can be configured through `SystemConfig`:

```python
config = SystemConfig(
    enable_specialized_agents=True,  # Enable/disable specialized agent support
    enable_gnn_topology=True,        # Enable/disable GNN-based topology
    enable_virtual_nodes=True,       # Enable/disable virtual nodes
    default_task_complexity=0.5,     # Default task complexity score
    topology_update_frequency=100,   # Topology updates per task
    communication_threshold=0.3      # Minimum communication weight threshold
)
```

## Best Practices

1. **Experimental Setup**
   - Use consistent parameters across experiment runs
   - Ensure datasets are properly formatted
   - Monitor resource usage during batch processing

2. **Task Description Quality**
   - Provide detailed task descriptions for better topology optimization
   - Include clear capability requirements
   - Specify task type for specialized routing

3. **Resource Management**
   - Clean up completed tasks using `cleanup_task`
   - Monitor and adjust topology update frequency
   - Track communication weights for optimization

4. **Error Handling**
   - Handle specialized agent unavailability
   - Manage task context updates appropriately
   - Monitor topology optimization results

## Future Enhancements

1. **Advanced Features**
   - Enhanced GNN architectures for topology optimization
   - Additional specialized agent types
   - Improved task analysis capabilities

2. **Experimental Extensions**
   - Support for additional benchmark datasets
   - Custom topology configurations
   - Advanced metrics collection

3. **Integration Roadmap**
   - Extended specialized agent capabilities
   - Enhanced virtual node interactions
   - Improved topology visualization

## Acknowledgements

This integration builds upon the [GDesigner](https://github.com/metauto-ai/GPTSwarm) framework and incorporates concepts from related work in multi-agent systems.
