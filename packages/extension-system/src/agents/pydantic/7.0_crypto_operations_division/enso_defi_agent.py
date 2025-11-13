"""
ENSO DeFi Operations Agent

This agent handles decentralized finance operations using the ENSO protocol
for intent-based execution. It can swap, stake, bridge, and manage DeFi positions
across multiple chains with optimal gas efficiency.

Division: 7.0 Crypto Operations
Protocol: ENSO (Layer 2 - Interoperability)
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Literal
from decimal import Decimal

# ===== Input Models =====

class EnsoDeFiInput(BaseModel):
    """
    Input parameters for ENSO DeFi operations.
    """
    operation_type: Literal["swap", "stake", "bridge", "withdraw", "compound"] = Field(
        ...,
        description="The type of DeFi operation to perform"
    )
    token_in: str = Field(..., description="Token symbol or address to use as input (e.g., 'ETH', 'USDC')")
    amount: str = Field(..., description="Amount to operate on (as string to preserve precision)")
    token_out: Optional[str] = Field(None, description="For swaps: output token symbol or address")
    chain_from: Optional[str] = Field(None, description="For bridges: source blockchain")
    chain_to: Optional[str] = Field(None, description="For bridges: destination blockchain")
    strategy: Optional[Literal["highest_yield", "lowest_risk", "balanced"]] = Field(
        "highest_yield",
        description="For staking: yield optimization strategy"
    )
    slippage_tolerance: float = Field(0.5, ge=0.0, le=5.0, description="Maximum acceptable slippage in percent")
    gas_priority: Literal["low", "medium", "high"] = Field("medium", description="Gas price priority")

    @validator('amount')
    def validate_amount(cls, v):
        """Ensure amount is a valid positive number"""
        try:
            amount_decimal = Decimal(v)
            if amount_decimal <= 0:
                raise ValueError("Amount must be positive")
            return v
        except:
            raise ValueError("Invalid amount format")


class TokenSwapInput(BaseModel):
    """
    Simplified input for token swaps.
    """
    from_token: str = Field(..., description="Token to swap from")
    to_token: str = Field(..., description="Token to swap to")
    amount: str = Field(..., description="Amount to swap")
    min_output: Optional[str] = Field(None, description="Minimum acceptable output amount")
    slippage_tolerance: float = Field(0.5, ge=0.0, le=5.0)


class YieldStakingInput(BaseModel):
    """
    Input for yield optimization and staking operations.
    """
    token: str = Field(..., description="Token to stake")
    amount: str = Field(..., description="Amount to stake")
    min_apy: Optional[float] = Field(None, ge=0.0, le=100.0, description="Minimum acceptable APY")
    lock_period: Optional[int] = Field(None, ge=0, description="Lock period in days (0 for flexible)")
    strategy: Literal["highest_yield", "lowest_risk", "balanced"] = "highest_yield"


class CrossChainBridgeInput(BaseModel):
    """
    Input for cross-chain bridging operations.
    """
    token: str = Field(..., description="Token to bridge")
    amount: str = Field(..., description="Amount to bridge")
    from_chain: str = Field(..., description="Source blockchain")
    to_chain: str = Field(..., description="Destination blockchain")
    recipient_address: Optional[str] = Field(None, description="Recipient address on destination chain")


# ===== Output Models =====

class TransactionResult(BaseModel):
    """
    Details of a completed on-chain transaction.
    """
    tx_hash: str = Field(..., description="Transaction hash")
    block_number: int = Field(..., description="Block number where transaction was mined")
    gas_used: int = Field(..., description="Gas consumed by transaction")
    gas_price_gwei: str = Field(..., description="Gas price in Gwei")
    total_cost_eth: str = Field(..., description="Total transaction cost in ETH")
    explorer_url: str = Field(..., description="Block explorer URL for transaction")
    status: Literal["success", "failed"] = Field(..., description="Transaction status")


class TokenAmount(BaseModel):
    """
    Represents a token amount with metadata.
    """
    token_symbol: str
    token_address: str
    amount: str = Field(..., description="Amount with full precision")
    amount_usd: Optional[str] = Field(None, description="USD value at execution time")
    decimals: int = Field(18, description="Token decimals")


class RouteStep(BaseModel):
    """
    A single step in a multi-hop DeFi route.
    """
    protocol: str = Field(..., description="Protocol used (e.g., 'Uniswap V3', 'Aave')")
    action: str = Field(..., description="Action performed (e.g., 'swap', 'deposit')")
    from_token: TokenAmount
    to_token: TokenAmount
    gas_estimate: int


class EnsoExecutionResult(BaseModel):
    """
    Comprehensive result of an ENSO DeFi operation.
    """
    operation_type: str = Field(..., description="Type of operation executed")
    status: Literal["success", "failed", "pending"] = Field(..., description="Execution status")

    # Input details
    input_amount: TokenAmount = Field(..., description="Input token and amount")
    output_amount: Optional[TokenAmount] = Field(None, description="Output token and amount (for swaps)")

    # Execution details
    route_taken: List[RouteStep] = Field(..., description="The optimal route that was executed")
    steps_executed: int = Field(..., description="Number of protocol interactions")
    execution_time_seconds: float = Field(..., description="Total execution time")

    # Transaction details
    transaction: TransactionResult = Field(..., description="On-chain transaction details")

    # Financial metrics
    total_gas_cost_usd: str = Field(..., description="Total gas cost in USD")
    price_impact: float = Field(..., description="Price impact percentage")
    effective_rate: Optional[str] = Field(None, description="Effective exchange rate (for swaps)")

    # Results
    final_balance: Dict[str, str] = Field(..., description="Final token balances after operation")
    apy: Optional[float] = Field(None, description="Annual percentage yield (for staking)")

    # Metadata
    timestamp: str = Field(..., description="ISO timestamp of execution")
    enso_route_id: str = Field(..., description="ENSO route identifier for tracking")

    # Error handling
    error_message: Optional[str] = Field(None, description="Error message if status is 'failed'")
    retry_suggested: bool = Field(False, description="Whether retry is recommended")


class YieldOpportunity(BaseModel):
    """
    Details about a yield farming opportunity.
    """
    protocol: str = Field(..., description="Protocol name (e.g., 'Aave', 'Compound')")
    pool_name: str = Field(..., description="Pool or strategy name")
    token: str = Field(..., description="Token being staked")
    apy: float = Field(..., ge=0.0, le=1000.0, description="Current APY")
    tvl: str = Field(..., description="Total Value Locked in USD")
    risk_score: float = Field(..., ge=0.0, le=10.0, description="Risk score (0=lowest, 10=highest)")
    lock_period: int = Field(..., description="Lock period in days (0 for flexible)")
    chain: str = Field(..., description="Blockchain where the opportunity exists")


class YieldOptimizationReport(BaseModel):
    """
    Report from yield optimization analysis.
    """
    recommended_strategy: YieldOpportunity = Field(..., description="Top recommended yield opportunity")
    alternative_strategies: List[YieldOpportunity] = Field(..., description="Alternative options ranked by score")
    projected_returns: Dict[str, str] = Field(..., description="Projected returns over different time periods")
    risk_analysis: str = Field(..., description="Comprehensive risk analysis of recommendation")
    gas_cost_estimate: str = Field(..., description="Estimated gas cost for entering position")
    breakeven_time_days: int = Field(..., description="Days until gas costs are covered by yield")


class CrossChainBridgeResult(BaseModel):
    """
    Result of a cross-chain bridging operation.
    """
    status: Literal["initiated", "pending", "completed", "failed"]
    from_chain: str
    to_chain: str
    from_tx_hash: str = Field(..., description="Transaction hash on source chain")
    to_tx_hash: Optional[str] = Field(None, description="Transaction hash on destination chain")
    bridge_protocol: str = Field(..., description="Bridge protocol used")
    amount_sent: TokenAmount
    amount_received: Optional[TokenAmount] = Field(None, description="Amount received on destination chain")
    bridge_fee: str = Field(..., description="Bridge fee in USD")
    estimated_arrival_time: Optional[str] = Field(None, description="Estimated time for completion")
    tracking_url: str = Field(..., description="URL to track bridge transaction")


# ===== Agent Metadata =====

class EnsoDeFiAgentMetadata(BaseModel):
    """
    Metadata describing the ENSO DeFi Agent's capabilities.
    """
    agent_name: str = "enso-defi-agent"
    version: str = "1.0.0"
    description: str = Field(
        default="Executes decentralized finance operations using the ENSO intent-based execution engine. "
        "Handles token swaps, yield optimization, staking, cross-chain bridging, and complex DeFi strategies "
        "with automatic route optimization and minimal gas costs."
    )
    capabilities: List[str] = Field(default=[
        "Token swaps with optimal routing",
        "Yield farming and staking",
        "Cross-chain token bridging",
        "DeFi position management",
        "Gas optimization",
        "Multi-protocol aggregation",
        "Intent-based execution",
        "Slippage protection"
    ])
    supported_chains: List[str] = Field(default=[
        "ethereum",
        "base",
        "arbitrum",
        "optimism",
        "polygon",
        "avalanche"
    ])
    supported_operations: List[str] = Field(default=[
        "swap",
        "stake",
        "bridge",
        "withdraw",
        "compound"
    ])

    input_models: List[str] = Field(default=[
        "EnsoDeFiInput",
        "TokenSwapInput",
        "YieldStakingInput",
        "CrossChainBridgeInput"
    ])

    output_models: List[str] = Field(default=[
        "EnsoExecutionResult",
        "YieldOptimizationReport",
        "CrossChainBridgeResult"
    ])

    protocols_integrated: List[str] = Field(default=[
        "Uniswap V2/V3",
        "Aave",
        "Compound",
        "Curve",
        "Balancer",
        "ENSO Router"
    ])

    llm_consumable_description: str = Field(
        default="I can execute any DeFi operation using natural language intents. "
        "Simply tell me what you want to do (e.g., 'Swap 10 ETH for USDC', 'Stake 100 USDC for highest yield', "
        "'Bridge 50 USDC from Ethereum to Arbitrum') and I'll find the optimal route, minimize gas costs, "
        "and execute atomically. I support multi-step operations and can route across any supported chain."
    )
