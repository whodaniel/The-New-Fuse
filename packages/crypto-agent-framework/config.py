"""
Configuration management for 4-Layer Crypto AI Agent Framework
"""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent.parent


class Config:
    """Configuration class for the crypto agent framework"""

    # ===== Agent Identity =====
    AGENT_ID: str = os.getenv("AGENT_ID", "crypto-agent-001")
    AGENT_NAME: str = os.getenv("AGENT_NAME", "The New Fuse Crypto Agent")

    # ===== Wallet / Identity =====
    AGENT_PRIVATE_KEY: Optional[str] = os.getenv("AGENT_PRIVATE_KEY")
    AGENT_MNEMONIC: Optional[str] = os.getenv("AGENT_MNEMONIC")
    ARWEAVE_KEYFILE: Optional[str] = os.getenv("ARWEAVE_KEYFILE_PATH")

    # ===== L2: ENSO API (Interoperability Layer) =====
    ENSO_API_KEY: Optional[str] = os.getenv("ENSO_API_KEY")
    ENSO_API_URL: str = os.getenv("ENSO_API_URL", "https://api.enso.finance/api/v1")
    ENSO_ROUTER_ADDRESS: str = os.getenv("ENSO_ROUTER_ADDRESS", "")

    # ===== L3: Compute APIs =====
    # Akash Network
    AKASH_API_KEY: Optional[str] = os.getenv("AKASH_API_KEY")
    AKASH_API_URL: str = os.getenv("AKASH_API_URL", "https://api.akash.network/v1")
    AKASH_WALLET_ADDRESS: Optional[str] = os.getenv("AKASH_WALLET_ADDRESS")

    # Render Network
    RENDER_API_KEY: Optional[str] = os.getenv("RENDER_API_KEY")
    RENDER_API_URL: str = os.getenv("RENDER_API_URL", "https://api.rendernetwork.com/v1")
    RENDER_WALLET_ADDRESS: Optional[str] = os.getenv("RENDER_WALLET_ADDRESS")

    # ===== L4: Memory (Arweave & AO) =====
    ARWEAVE_NODE_URL: str = os.getenv("ARWEAVE_NODE_URL", "https://arweave.net")
    ARWEAVE_GATEWAY_URL: str = os.getenv("ARWEAVE_GATEWAY_URL", "https://arweave.net")
    AGENT_AO_PROCESS_ID: Optional[str] = os.getenv("AGENT_AO_PROCESS_ID")
    AO_MU_URL: str = os.getenv("AO_MU_URL", "https://mu.ao-testnet.xyz")
    AO_CU_URL: str = os.getenv("AO_CU_URL", "https://cu.ao-testnet.xyz")

    # ===== Blockchain Networks =====
    # Ethereum
    ETH_RPC_URL: str = os.getenv("ETH_RPC_URL", "https://eth-mainnet.g.alchemy.com/v2/")
    ETH_CHAIN_ID: int = int(os.getenv("ETH_CHAIN_ID", "1"))

    # Base (Layer 2)
    BASE_RPC_URL: str = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
    BASE_CHAIN_ID: int = int(os.getenv("BASE_CHAIN_ID", "8453"))

    # Arbitrum
    ARB_RPC_URL: str = os.getenv("ARB_RPC_URL", "https://arb1.arbitrum.io/rpc")
    ARB_CHAIN_ID: int = int(os.getenv("ARB_CHAIN_ID", "42161"))

    # Optimism
    OP_RPC_URL: str = os.getenv("OP_RPC_URL", "https://mainnet.optimism.io")
    OP_CHAIN_ID: int = int(os.getenv("OP_CHAIN_ID", "10"))

    # ===== Fetch.ai uAgents Configuration =====
    UAGENTS_SEED_PHRASE: Optional[str] = os.getenv("UAGENTS_SEED_PHRASE")
    UAGENTS_MAILBOX_KEY: Optional[str] = os.getenv("UAGENTS_MAILBOX_KEY")
    UAGENTS_AGENT_ADDRESS: Optional[str] = os.getenv("UAGENTS_AGENT_ADDRESS")

    # ===== LLM Configuration (for Decision Engine) =====
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    DEFAULT_LLM_MODEL: str = os.getenv("DEFAULT_LLM_MODEL", "gpt-4")

    # ===== Integration with existing TNF backend =====
    TNF_API_URL: str = os.getenv("TNF_API_URL", "http://localhost:3001/api")
    TNF_API_KEY: Optional[str] = os.getenv("TNF_API_KEY")
    TNF_POSTGRES_URL: Optional[str] = os.getenv("DATABASE_URL")
    TNF_REDIS_URL: Optional[str] = os.getenv("REDIS_URL", "redis://localhost:6379")

    # ===== Operational Settings =====
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    EXECUTION_TIMEOUT: int = int(os.getenv("EXECUTION_TIMEOUT", "300"))  # 5 minutes
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    RETRY_DELAY: int = int(os.getenv("RETRY_DELAY", "2"))  # seconds

    # ===== Feature Flags =====
    ENABLE_ARWEAVE_LOGGING: bool = os.getenv("ENABLE_ARWEAVE_LOGGING", "true").lower() == "true"
    ENABLE_AO_STATE: bool = os.getenv("ENABLE_AO_STATE", "true").lower() == "true"
    ENABLE_UAGENTS: bool = os.getenv("ENABLE_UAGENTS", "false").lower() == "true"
    ENABLE_ENSO: bool = os.getenv("ENABLE_ENSO", "true").lower() == "true"

    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present"""
        errors = []

        # Check critical keys
        if not cls.AGENT_PRIVATE_KEY and not cls.AGENT_MNEMONIC:
            errors.append("Either AGENT_PRIVATE_KEY or AGENT_MNEMONIC must be set")

        if cls.ENABLE_ARWEAVE_LOGGING and not cls.ARWEAVE_KEYFILE:
            errors.append("ARWEAVE_KEYFILE_PATH required when ENABLE_ARWEAVE_LOGGING=true")

        if cls.ENABLE_ENSO and not cls.ENSO_API_KEY:
            errors.append("ENSO_API_KEY required when ENABLE_ENSO=true")

        if errors:
            print(f"Configuration errors: {'; '.join(errors)}")
            return False

        return True

    @classmethod
    def get_chain_config(cls, chain_name: str) -> dict:
        """Get configuration for a specific blockchain"""
        chains = {
            "ethereum": {"rpc_url": cls.ETH_RPC_URL, "chain_id": cls.ETH_CHAIN_ID},
            "base": {"rpc_url": cls.BASE_RPC_URL, "chain_id": cls.BASE_CHAIN_ID},
            "arbitrum": {"rpc_url": cls.ARB_RPC_URL, "chain_id": cls.ARB_CHAIN_ID},
            "optimism": {"rpc_url": cls.OP_RPC_URL, "chain_id": cls.OP_CHAIN_ID},
        }
        return chains.get(chain_name.lower(), {})


# Export singleton instance
config = Config()
