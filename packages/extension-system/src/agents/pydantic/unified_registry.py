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
    registry_path = ".agent/agents/consolidated/pydantic_registry.json"

    # Load existing registry JSON if present and re-export for consistency checks.
    if os.path.exists(registry_path):
        with open(registry_path, "r") as f:
            data = json.load(f)
        if isinstance(data, list):
            for entry in data:
                registry.register_agent(AgentMetadataSchema(**entry))

    registry.export_to_json(registry_path)
