"""
Layer 1: Decision Engine (The "Brain")
Parses natural language requests into structured, multi-step execution plans.
"""
import re
from typing import List, Dict, Any, Optional
from enum import Enum

from ..utils.logger import get_logger

logger = get_logger(__name__)


class TaskLayer(str, Enum):
    """Execution layer for a task"""
    L2_ACTION = "L2-Action"        # Financial transactions (ENSO)
    L3_COMPUTE = "L3-Compute"      # Compute jobs (Akash/Render)
    L4_MEMORY = "L4-Memory"        # Memory operations (Arweave/AO)


class TaskType(str, Enum):
    """Types of tasks the agent can perform"""
    # L3 Compute Tasks
    GENERATE_3D = "generate_3d"
    GENERATE_IMAGE = "generate_image"
    TRAIN_MODEL = "train_model"
    RUN_INFERENCE = "run_inference"

    # L2 Action Tasks
    SWAP_TOKENS = "swap_tokens"
    STAKE_TOKENS = "stake_tokens"
    BRIDGE_TOKENS = "bridge_tokens"
    MINT_NFT = "mint_nft"
    LIST_NFT = "list_nft"
    BUY_NFT = "buy_nft"

    # L4 Memory Tasks
    SAVE_STATE = "save_state"
    QUERY_LOGS = "query_logs"


class DecisionEngine:
    """
    The agent's "brain." Parses natural language requests
    into a structured, multi-step execution plan.

    In production, this would integrate with an LLM (GPT-4, Claude, etc.)
    via Fetch.ai's ASI:One or similar. For now, uses rule-based parsing
    with extensible architecture.
    """

    def __init__(self, use_llm: bool = False, llm_provider: Optional[str] = None):
        self.use_llm = use_llm
        self.llm_provider = llm_provider
        logger.info(
            "Decision Engine Initialized (L1 Brain)",
            use_llm=use_llm,
            provider=llm_provider
        )

    def analyze_request(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Parses a prompt and returns a list of execution steps.

        Args:
            prompt: Natural language task description

        Returns:
            List of task steps to execute

        Example:
            >>> engine = DecisionEngine()
            >>> plan = engine.analyze_request(
            ...     "Generate a 3D model of a red sports car, mint it as NFT"
            ... )
            >>> len(plan)
            2
        """
        logger.info(
            "Analyzing request",
            prompt=prompt[:100]
        )

        if self.use_llm:
            return self._analyze_with_llm(prompt)
        else:
            return self._analyze_with_rules(prompt)

    def _analyze_with_rules(self, prompt: str) -> List[Dict[str, Any]]:
        """Rule-based intent parsing (fast, deterministic)"""

        plan = []
        prompt_lower = prompt.lower()

        # ===== Rule 1: 3D Model Generation =====
        if any(keyword in prompt_lower for keyword in ["generate 3d", "3d model", "create 3d"]):
            # Extract subject
            subject_match = re.search(r"of (?:a |an )?([^,\.]+)", prompt)
            subject = subject_match.group(1) if subject_match else "object"

            plan.append({
                "layer": TaskLayer.L3_COMPUTE,
                "service": "Render",
                "task_type": TaskType.GENERATE_3D,
                "task": "dispatch_render_job",
                "spec": {
                    "engine": "StabilityAI",
                    "prompt": subject.strip(),
                    "format": "glb",
                    "resolution": "1024x1024"
                },
                "description": f"Generate 3D model of '{subject}'"
            })

        # ===== Rule 2: Image Generation =====
        if any(keyword in prompt_lower for keyword in ["generate image", "create image", "draw"]):
            subject_match = re.search(r"of (?:a |an )?([^,\.]+)", prompt)
            subject = subject_match.group(1) if subject_match else "image"

            plan.append({
                "layer": TaskLayer.L3_COMPUTE,
                "service": "Render",
                "task_type": TaskType.GENERATE_IMAGE,
                "task": "dispatch_render_job",
                "spec": {
                    "engine": "StabilityAI",
                    "prompt": subject.strip(),
                    "format": "png",
                    "resolution": "1024x1024"
                },
                "description": f"Generate image of '{subject}'"
            })

        # ===== Rule 3: AI Model Training =====
        if "train" in prompt_lower and "model" in prompt_lower:
            plan.append({
                "layer": TaskLayer.L3_COMPUTE,
                "service": "Akash",
                "task_type": TaskType.TRAIN_MODEL,
                "task": "dispatch_akash_job",
                "spec": {
                    "image": "my-training-container:latest",
                    "gpus": "1x NVIDIA A100",
                    "memory": "32GB",
                    "cpu": "8"
                },
                "description": "Train AI model"
            })

        # ===== Rule 4: Token Swap =====
        swap_pattern = r"swap (\d+(?:\.\d+)?)\s*([A-Z]+)\s*(?:for|to)\s*([A-Z]+)"
        swap_match = re.search(swap_pattern, prompt, re.IGNORECASE)

        if swap_match:
            amount, from_token, to_token = swap_match.groups()
            plan.append({
                "layer": TaskLayer.L2_ACTION,
                "service": "ENSO",
                "task_type": TaskType.SWAP_TOKENS,
                "task": "swap_tokens",
                "spec": {
                    "from_token": from_token,
                    "to_token": to_token,
                    "amount": amount
                },
                "description": f"Swap {amount} {from_token} to {to_token}"
            })

        # ===== Rule 5: Staking / Yield =====
        if any(keyword in prompt_lower for keyword in ["stake", "yield", "earn"]):
            amount_match = re.search(r"(\d+(?:\.\d+)?)\s*([A-Z]+)", prompt)

            if amount_match:
                amount, token = amount_match.groups()
                plan.append({
                    "layer": TaskLayer.L2_ACTION,
                    "service": "ENSO",
                    "task_type": TaskType.STAKE_TOKENS,
                    "task": "stake_for_yield",
                    "spec": {
                        "token": token,
                        "amount": amount,
                        "strategy": "highest-yield"
                    },
                    "description": f"Stake {amount} {token} for maximum yield"
                })

        # ===== Rule 6: NFT Minting =====
        if "mint" in prompt_lower and "nft" in prompt_lower:
            # Check if this is part of a multi-step flow
            chain = "base"  # Default to Base
            if "ethereum" in prompt_lower:
                chain = "ethereum"
            elif "arbitrum" in prompt_lower:
                chain = "arbitrum"

            plan.append({
                "layer": TaskLayer.L2_ACTION,
                "service": "ENSO",
                "task_type": TaskType.MINT_NFT,
                "task": "mint_nft",
                "spec": {
                    "chain": chain,
                    "metadata_url": "${ASSET_URL}",  # Placeholder for previous step
                    "listing_price": "100 USDC"  # Default
                },
                "description": f"Mint NFT on {chain}"
            })

        # ===== Rule 7: NFT Listing/Selling =====
        if any(keyword in prompt_lower for keyword in ["sell nft", "list nft"]):
            price_match = re.search(r"(\d+(?:\.\d+)?)\s*([A-Z]+)", prompt)
            price = price_match.group(1) if price_match else "100"
            currency = price_match.group(2) if price_match else "USDC"

            plan.append({
                "layer": TaskLayer.L2_ACTION,
                "service": "ENSO",
                "task_type": TaskType.LIST_NFT,
                "task": "list_nft",
                "spec": {
                    "marketplace": "OpenSea",
                    "price": f"{price} {currency}",
                    "nft_address": "${NFT_ADDRESS}"  # From previous step
                },
                "description": f"List NFT for {price} {currency}"
            })

        # ===== Rule 8: Bridging =====
        bridge_pattern = r"bridge.*?(\d+(?:\.\d+)?)\s*([A-Z]+).*?from\s+(\w+)\s+to\s+(\w+)"
        bridge_match = re.search(bridge_pattern, prompt, re.IGNORECASE)

        if bridge_match:
            amount, token, from_chain, to_chain = bridge_match.groups()
            plan.append({
                "layer": TaskLayer.L2_ACTION,
                "service": "ENSO",
                "task_type": TaskType.BRIDGE_TOKENS,
                "task": "bridge_tokens",
                "spec": {
                    "token": token,
                    "amount": amount,
                    "from_chain": from_chain,
                    "to_chain": to_chain
                },
                "description": f"Bridge {amount} {token} from {from_chain} to {to_chain}"
            })

        # ===== Fallback: Generic Intent =====
        if not plan:
            logger.warning(
                "Could not parse prompt with rules, creating generic intent",
                prompt=prompt
            )
            plan.append({
                "layer": TaskLayer.L2_ACTION,
                "service": "ENSO",
                "task_type": "generic",
                "task": "submit_intent",
                "spec": {
                    "intent": prompt
                },
                "description": "Execute generic intent"
            })

        logger.info(
            "Execution plan generated",
            steps=len(plan),
            layers=[step["layer"] for step in plan]
        )

        return plan

    def _analyze_with_llm(self, prompt: str) -> List[Dict[str, Any]]:
        """
        LLM-based intent parsing (flexible, handles complex requests).

        This would integrate with OpenAI, Anthropic, or Fetch.ai's ASI:One
        to generate structured execution plans from natural language.

        For now, returns a placeholder.
        """
        logger.info("Using LLM for intent parsing (not yet implemented)")

        # TODO: Implement LLM integration
        # Example structure:
        # 1. Send prompt to LLM with system instructions
        # 2. Request structured JSON response with task breakdown
        # 3. Validate and return plan

        # Fallback to rules for now
        return self._analyze_with_rules(prompt)

    def validate_plan(self, plan: List[Dict[str, Any]]) -> bool:
        """Validate that a plan is executable"""

        for step in plan:
            if "layer" not in step:
                logger.error("Invalid plan: missing layer", step=step)
                return False

            if "service" not in step:
                logger.error("Invalid plan: missing service", step=step)
                return False

            if "task" not in step:
                logger.error("Invalid plan: missing task", step=step)
                return False

        return True

    def optimize_plan(self, plan: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Optimize execution plan by:
        - Combining parallel tasks
        - Minimizing gas costs
        - Reducing cross-chain operations
        """

        # TODO: Implement plan optimization
        # For now, return plan as-is

        return plan
