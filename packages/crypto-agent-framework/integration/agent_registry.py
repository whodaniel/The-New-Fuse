"""
Crypto Agent Registry Integration

This module registers crypto agents with The New Fuse's orchestrator,
making them discoverable and executable within the TNF ecosystem.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List

# Add paths for imports
sys.path.insert(
    0,
    str(
        Path(__file__).resolve().parents[3]
        / "packages"
        / "protocol-contracts"
        / "generated"
        / "python"
    ),
)

# Import metadata from Pydantic agents
try:
    from tnf_contracts.crypto_operations import (
        EnsoDeFiAgentMetadata,
        RenderNetworkAgentMetadata,
        AkashComputeAgentMetadata,
        ArweaveMemoryAgentMetadata,
    )
except ImportError as e:
    print(f"Warning: Could not import agent metadata: {e}")
    print("Some functionality may be limited")


class CryptoAgentRegistry:
    """
    Registry for crypto agents within The New Fuse ecosystem.

    This class provides:
    - Agent discovery and metadata
    - Capability queries
    - Integration with orchestrator_agent.py
    """

    def __init__(self):
        """Initialize the crypto agent registry."""
        self.agents = self._build_agent_registry()

    def _build_agent_registry(self) -> Dict[str, Dict[str, Any]]:
        """
        Build the agent registry from Pydantic metadata.

        Returns:
            Dictionary mapping agent names to their metadata
        """
        registry = {}

        # Register ENSO DeFi Agent
        enso_meta = EnsoDeFiAgentMetadata()
        registry["enso-defi-agent"] = {
            "name": enso_meta.agent_name,
            "version": enso_meta.version,
            "description": enso_meta.description,
            "capabilities": enso_meta.capabilities,
            "division": "7.0_crypto_operations",
            "layer": "Layer 2 - Interoperability",
            "protocol": "ENSO",
            "input_models": enso_meta.input_models,
            "output_models": enso_meta.output_models,
            "supported_chains": enso_meta.supported_chains,
            "supported_operations": enso_meta.supported_operations,
            "llm_description": enso_meta.llm_consumable_description,
            "tags": ["defi", "swap", "staking", "bridge", "yield", "enso"],
        }

        # Register Render Network Agent
        render_meta = RenderNetworkAgentMetadata()
        registry["render-network-agent"] = {
            "name": render_meta.agent_name,
            "version": render_meta.version,
            "description": render_meta.description,
            "capabilities": render_meta.capabilities,
            "division": "7.0_crypto_operations",
            "layer": "Layer 3 - Compute",
            "protocol": "Render Network",
            "input_models": render_meta.input_models,
            "output_models": render_meta.output_models,
            "supported_engines": render_meta.supported_engines,
            "supported_formats": render_meta.supported_formats,
            "llm_description": render_meta.llm_consumable_description,
            "tags": ["3d", "render", "generation", "ai", "gpu", "nft"],
        }

        # Register Akash Compute Agent
        akash_meta = AkashComputeAgentMetadata()
        registry["akash-compute-agent"] = {
            "name": akash_meta.agent_name,
            "version": akash_meta.version,
            "description": akash_meta.description,
            "capabilities": akash_meta.capabilities,
            "division": "7.0_crypto_operations",
            "layer": "Layer 3 - Compute",
            "protocol": "Akash Network",
            "input_models": akash_meta.input_models,
            "output_models": akash_meta.output_models,
            "supported_gpu_models": akash_meta.supported_gpu_models,
            "cost_advantages": akash_meta.cost_advantages,
            "llm_description": akash_meta.llm_consumable_description,
            "tags": ["compute", "ai_training", "inference", "deployment", "docker", "gpu"],
        }

        # Register Arweave Memory Agent
        arweave_meta = ArweaveMemoryAgentMetadata()
        registry["arweave-memory-agent"] = {
            "name": arweave_meta.agent_name,
            "version": arweave_meta.version,
            "description": arweave_meta.description,
            "capabilities": arweave_meta.capabilities,
            "division": "7.0_crypto_operations",
            "layer": "Layer 4 - Memory",
            "protocol": "Arweave + AO",
            "input_models": arweave_meta.input_models,
            "output_models": arweave_meta.output_models,
            "storage_guarantees": arweave_meta.storage_guarantees,
            "typical_use_cases": arweave_meta.typical_use_cases,
            "llm_description": arweave_meta.llm_consumable_description,
            "tags": ["storage", "permanent", "immutable", "audit", "compliance", "state"],
        }

        return registry

    def get_agent_metadata(self, agent_name: str) -> Dict[str, Any]:
        """
        Get metadata for a specific agent.

        Args:
            agent_name: Name of the agent (e.g., "enso-defi-agent")

        Returns:
            Agent metadata dictionary

        Raises:
            KeyError: If agent not found
        """
        if agent_name not in self.agents:
            raise KeyError(f"Agent '{agent_name}' not found in registry")

        return self.agents[agent_name]

    def list_agents(self) -> List[str]:
        """
        List all registered agent names.

        Returns:
            List of agent names
        """
        return list(self.agents.keys())

    def search_by_capability(self, capability: str) -> List[str]:
        """
        Find agents by capability.

        Args:
            capability: Capability to search for (case-insensitive substring match)

        Returns:
            List of agent names with matching capability
        """
        capability_lower = capability.lower()
        matching_agents = []

        for agent_name, metadata in self.agents.items():
            agent_capabilities = [cap.lower() for cap in metadata.get("capabilities", [])]
            if any(capability_lower in cap for cap in agent_capabilities):
                matching_agents.append(agent_name)

        return matching_agents

    def search_by_tag(self, tag: str) -> List[str]:
        """
        Find agents by tag.

        Args:
            tag: Tag to search for

        Returns:
            List of agent names with matching tag
        """
        tag_lower = tag.lower()
        matching_agents = []

        for agent_name, metadata in self.agents.items():
            agent_tags = [t.lower() for t in metadata.get("tags", [])]
            if tag_lower in agent_tags:
                matching_agents.append(agent_name)

        return matching_agents

    def search_by_layer(self, layer: str) -> List[str]:
        """
        Find agents by architectural layer.

        Args:
            layer: Layer name (e.g., "Layer 2 - Interoperability")

        Returns:
            List of agent names in that layer
        """
        matching_agents = []

        for agent_name, metadata in self.agents.items():
            if metadata.get("layer") == layer:
                matching_agents.append(agent_name)

        return matching_agents

    def get_llm_consumable_registry(self) -> str:
        """
        Generate an LLM-consumable description of all crypto agents.

        This is useful for providing context to AI orchestrators about
        available crypto capabilities.

        Returns:
            Formatted string describing all agents
        """
        output = []
        output.append("=== CRYPTO AGENT CAPABILITIES ===\n")

        for agent_name, metadata in self.agents.items():
            output.append(f"\n**{metadata['name']}** ({metadata['layer']})")
            output.append(f"Protocol: {metadata['protocol']}")
            output.append(f"\n{metadata['llm_description']}\n")
            output.append("Capabilities:")
            for cap in metadata['capabilities']:
                output.append(f"  • {cap}")
            output.append("")

        return "\n".join(output)

    def export_for_orchestrator(self) -> Dict[str, Any]:
        """
        Export agent registry in a format compatible with orchestrator_agent.py

        Returns:
            Dictionary compatible with OrchestratorState.agent_registry
        """
        orchestrator_format = {}

        for agent_name, metadata in self.agents.items():
            orchestrator_format[agent_name] = {
                "agent_name": metadata["name"],
                "version": metadata["version"],
                "description": metadata["description"],
                "capabilities": metadata["capabilities"],
                "input_models": metadata["input_models"],
                "output_models": metadata["output_models"],
                "division": metadata["division"],
                "layer": metadata["layer"],
                "protocol": metadata["protocol"],
                "tags": metadata["tags"],
            }

        return orchestrator_format

    def generate_capability_matrix(self) -> str:
        """
        Generate a capability matrix showing what each agent can do.

        Returns:
            Formatted table of agent capabilities
        """
        output = []
        output.append("\n" + "=" * 80)
        output.append("CRYPTO AGENT CAPABILITY MATRIX")
        output.append("=" * 80 + "\n")

        # Collect all unique capabilities
        all_capabilities = set()
        for metadata in self.agents.values():
            all_capabilities.update(metadata.get("capabilities", []))

        # Build matrix
        for agent_name, metadata in self.agents.items():
            output.append(f"\n{metadata['name'].upper()}")
            output.append("-" * 40)
            output.append(f"Layer: {metadata['layer']}")
            output.append(f"Protocol: {metadata['protocol']}")
            output.append("\nCapabilities:")
            for cap in metadata.get("capabilities", []):
                output.append(f"  ✓ {cap}")

        output.append("\n" + "=" * 80 + "\n")
        return "\n".join(output)


# ===== Integration Functions =====

def register_crypto_agents_with_orchestrator() -> Dict[str, Any]:
    """
    Register all crypto agents with The New Fuse orchestrator.

    This function should be called during TNF initialization to make
    crypto agents available to the orchestration system.

    Returns:
        Agent registry dictionary for orchestrator
    """
    registry = CryptoAgentRegistry()
    return registry.export_for_orchestrator()


def get_crypto_agent_llm_context() -> str:
    """
    Get LLM-consumable description of crypto agents.

    This can be included in system prompts to make AI orchestrators
    aware of crypto capabilities.

    Returns:
        Formatted string for LLM consumption
    """
    registry = CryptoAgentRegistry()
    return registry.get_llm_consumable_registry()


# ===== CLI Interface =====

def main():
    """CLI interface for exploring the crypto agent registry."""
    import json

    registry = CryptoAgentRegistry()

    print("\n" + "=" * 80)
    print("CRYPTO AGENT REGISTRY")
    print("=" * 80 + "\n")

    print(f"Total agents registered: {len(registry.list_agents())}\n")

    # List all agents
    print("Available Agents:")
    for agent_name in registry.list_agents():
        metadata = registry.get_agent_metadata(agent_name)
        print(f"  • {metadata['name']} - {metadata['description'][:60]}...")

    # Show capability matrix
    print(registry.generate_capability_matrix())

    # Show LLM-consumable format
    print("\nLLM-CONSUMABLE FORMAT:")
    print("-" * 80)
    print(registry.get_llm_consumable_registry())

    # Export for orchestrator
    print("\nORCHESTRATOR FORMAT:")
    print("-" * 80)
    orchestrator_export = registry.export_for_orchestrator()
    print(json.dumps(orchestrator_export, indent=2))

    # Example searches
    print("\n\nEXAMPLE SEARCHES:")
    print("-" * 80)

    print("\nAgents with 'swap' capability:")
    for agent in registry.search_by_capability("swap"):
        print(f"  • {agent}")

    print("\nAgents with 'gpu' tag:")
    for agent in registry.search_by_tag("gpu"):
        print(f"  • {agent}")

    print("\nLayer 3 - Compute agents:")
    for agent in registry.search_by_layer("Layer 3 - Compute"):
        print(f"  • {agent}")

    print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    main()
