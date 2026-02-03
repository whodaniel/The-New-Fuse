from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import os

class AgentCapabilitySchema(BaseModel):
    name: str
    description: str
    version: str
    parameters: Optional[Dict[str, Any]] = None

class AgentMetadataSchema(BaseModel):
    agent_id: str
    name: str
    version: str
    description: str
    type: str
    provider: str
    capabilities: List[AgentCapabilitySchema]
    config: Optional[Dict[str, Any]] = None
    tags: List[str] = []

class UnifiedAgentRegistry:
    def __init__(self):
        self.registry: Dict[str, AgentMetadataSchema] = {}

    def register_agent(self, metadata: AgentMetadataSchema):
        self.registry[metadata.agent_id] = metadata

    def get_agent(self, agent_id: str) -> Optional[AgentMetadataSchema]:
        return self.registry.get(agent_id)

    def list_agents(self) -> List[AgentMetadataSchema]:
        return list(self.registry.values())

    def export_to_json(self, file_path: str):
        directory = os.path.dirname(file_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        with open(file_path, 'w') as f:
            json.dump([m.dict() for m in self.list_agents()], f, indent=2)

if __name__ == "__main__":
    registry = UnifiedAgentRegistry()
    # Add dummy data for testing
    registry.register_agent(AgentMetadataSchema(
        agent_id="test-agent-python-v1",
        name="Test Python Agent",
        version="1.0.0",
        description="A test agent registered via Pydantic",
        type="CODER",
        provider="OPENAI",
        capabilities=[AgentCapabilitySchema(name="testing", description="Testing capability", version="1.0.0")],
        tags=["test", "python"]
    ))
    registry.export_to_json(".agent/agents/consolidated/pydantic_registry.json")
