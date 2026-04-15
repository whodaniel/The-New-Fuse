"""
Layer 2: Interoperability Service (ENSO)
Handles all on-chain financial transactions and smart contract interactions
via the ENSO intent-based execution engine.
"""
import json
import hashlib
from typing import Dict, Optional, Any, List
from enum import Enum

import httpx
from web3 import Web3
from eth_account import Account
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import config
from ..utils.logger import get_logger

logger = get_logger(__name__)


class IntentStatus(str, Enum):
    """Intent execution status"""
    PENDING = "pending"
    ROUTING = "routing"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"


class EnsoService:
    """
    Handles all on-chain financial actions via the ENSO intent engine.

    ENSO is an "intent-based execution engine" - your agent sends a high-level
    intent (e.g., "Stake 10 ETH for best yield"), and ENSO finds the optimal,
    most gas-efficient path and executes it as a single atomic transaction.

    This abstracts all cross-chain complexity, routing, bridging, and protocol
    interactions.

    Key Features:
    - Natural language intent submission
    - Cross-chain routing & bridging
    - Gas optimization
    - Atomic transaction bundling
    - DeFi protocol aggregation
    """

    def __init__(self):
        self.api_url = config.ENSO_API_URL
        self.api_key = config.ENSO_API_KEY
        self.router_address = config.ENSO_ROUTER_ADDRESS

        # Initialize Web3 for transaction signing
        self.w3 = Web3(Web3.HTTPProvider(config.ETH_RPC_URL))

        # Load agent wallet
        self.account = None
        if config.AGENT_PRIVATE_KEY:
            self.account = Account.from_key(config.AGENT_PRIVATE_KEY)
        elif config.AGENT_MNEMONIC:
            Account.enable_unaudited_hdwallet_features()
            self.account = Account.from_mnemonic(config.AGENT_MNEMONIC)

        logger.info(
            "ENSO Service Initialized (L2 Actions)",
            enabled=config.ENABLE_ENSO,
            wallet_address=self.account.address if self.account else None
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def submit_intent(
        self,
        intent_string: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Submits a high-level natural language or structured intent to ENSO.
        ENSO handles all execution, bundling, and routing.

        Args:
            intent_string: Natural language intent description
            params: Optional structured parameters

        Returns:
            Dictionary with execution results

        Example:
            >>> result = await enso.submit_intent(
            ...     "Stake 100 USDC in the highest-yield pool on any chain",
            ...     params={"slippage_tolerance": 0.5}
            ... )
        """
        if not config.ENABLE_ENSO:
            logger.warning("[ENSO] Service disabled, using mock mode")
            return self._mock_submit_intent(intent_string)

        if not self.api_key:
            logger.warning("[ENSO] API key not configured, using mock mode")
            return self._mock_submit_intent(intent_string)

        logger.info(
            "[ENSO] Submitting Intent",
            intent=intent_string[:100]
        )

        try:
            # Parse intent and build structured request
            intent_data = await self._parse_intent(intent_string, params or {})

            # Get optimal route from ENSO
            route = await self._get_enso_route(intent_data)

            if not route:
                return {
                    "status": IntentStatus.FAILED,
                    "error": "Could not find optimal route"
                }

            # Execute the route
            result = await self._execute_route(route)
            return result

        except Exception as e:
            logger.error(f"[ENSO] Error submitting intent: {e}")
            return {
                "status": IntentStatus.FAILED,
                "error": str(e)
            }

    async def _parse_intent(
        self,
        intent_string: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse natural language intent into structured format"""

        # In production, this would use an LLM to parse natural language
        # For now, we'll use keyword matching

        intent_data = {
            "intent": intent_string,
            "from_address": self.account.address if self.account else None,
            "params": params
        }

        # Extract intent type
        if "swap" in intent_string.lower():
            intent_data["type"] = "swap"
        elif "stake" in intent_string.lower() or "yield" in intent_string.lower():
            intent_data["type"] = "stake"
        elif "bridge" in intent_string.lower():
            intent_data["type"] = "bridge"
        elif "nft" in intent_string.lower() and "mint" in intent_string.lower():
            intent_data["type"] = "nft_mint"
        elif "nft" in intent_string.lower() and "sell" in intent_string.lower():
            intent_data["type"] = "nft_sell"
        else:
            intent_data["type"] = "generic"

        # Extract amounts and tokens (simplified)
        import re
        amount_match = re.search(r'(\d+(?:\.\d+)?)\s*([A-Z]+)', intent_string)
        if amount_match:
            intent_data["amount"] = amount_match.group(1)
            intent_data["token"] = amount_match.group(2)

        return intent_data

    async def _get_enso_route(self, intent_data: Dict[str, Any]) -> Optional[Dict]:
        """Get optimal route from ENSO API"""

        logger.info("[ENSO] Finding optimal route...")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_url}/route",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "chainId": config.ETH_CHAIN_ID,
                        "fromAddress": intent_data.get("from_address"),
                        "intent": intent_data
                    }
                )

                if response.status_code == 200:
                    route = response.json()
                    logger.info(
                        "[ENSO] Route found",
                        steps=len(route.get("route", [])),
                        estimated_gas=route.get("estimatedGas")
                    )
                    return route
                else:
                    logger.error(
                        "[ENSO] Route error",
                        status=response.status_code,
                        error=response.text
                    )
                    return None

        except Exception as e:
            logger.error(f"[ENSO] Error getting route: {e}")
            return None

    async def _execute_route(self, route: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the ENSO route on-chain"""

        logger.info("[ENSO] Executing route...")

        try:
            # Get transaction data from ENSO
            tx_data = route.get("tx")

            if not tx_data or not self.account:
                return {
                    "status": IntentStatus.FAILED,
                    "error": "Missing transaction data or wallet"
                }

            # Build transaction
            transaction = {
                "to": tx_data.get("to"),
                "value": int(tx_data.get("value", "0")),
                "data": tx_data.get("data"),
                "gas": int(tx_data.get("gas", "500000")),
                "gasPrice": self.w3.eth.gas_price,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "chainId": config.ETH_CHAIN_ID
            }

            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(
                transaction,
                private_key=self.account.key
            )

            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            tx_hash_hex = self.w3.to_hex(tx_hash)

            logger.info(
                "[ENSO] Transaction sent",
                tx_hash=tx_hash_hex
            )

            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            if receipt.status == 1:
                logger.info(
                    "[ENSO] Intent executed successfully",
                    tx_hash=tx_hash_hex,
                    block=receipt.blockNumber,
                    gas_used=receipt.gasUsed
                )

                return {
                    "status": IntentStatus.COMPLETED,
                    "tx_hash": tx_hash_hex,
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                    "steps_executed": len(route.get("route", [])),
                    "explorer_url": self._get_explorer_url(tx_hash_hex)
                }
            else:
                return {
                    "status": IntentStatus.FAILED,
                    "error": "Transaction reverted",
                    "tx_hash": tx_hash_hex
                }

        except Exception as e:
            logger.error(f"[ENSO] Error executing route: {e}")
            return {
                "status": IntentStatus.FAILED,
                "error": str(e)
            }

    def _mock_submit_intent(self, intent_string: str) -> Dict[str, Any]:
        """Mock intent submission for testing"""
        intent_hash = hashlib.sha256(intent_string.encode()).hexdigest()
        mock_tx_hash = f"0x_enso_mock_{intent_hash[:32]}"

        logger.debug(f"[ENSO:MOCK] Intent executed: {mock_tx_hash}")

        return {
            "status": IntentStatus.COMPLETED,
            "tx_hash": mock_tx_hash,
            "steps_executed": 7,
            "final_balance": "100.00 USDC",
            "gas_used": 250000,
            "mock": True
        }

    def _get_explorer_url(self, tx_hash: str) -> str:
        """Get block explorer URL for transaction"""
        explorers = {
            1: "https://etherscan.io/tx/",
            8453: "https://basescan.org/tx/",
            42161: "https://arbiscan.io/tx/",
            10: "https://optimistic.etherscan.io/tx/"
        }
        base_url = explorers.get(config.ETH_CHAIN_ID, "https://etherscan.io/tx/")
        return f"{base_url}{tx_hash}"

    # ===== Specialized Intent Methods =====

    async def swap_tokens(
        self,
        from_token: str,
        to_token: str,
        amount: str,
        chain_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Swap tokens using ENSO's optimal routing.

        Args:
            from_token: Token to swap from (address or symbol)
            to_token: Token to swap to (address or symbol)
            amount: Amount to swap
            chain_id: Target chain ID

        Returns:
            Execution result
        """
        intent = f"Swap {amount} {from_token} for {to_token}"
        if chain_id:
            intent += f" on chain {chain_id}"

        return await self.submit_intent(intent)

    async def stake_for_yield(
        self,
        token: str,
        amount: str,
        min_apy: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Stake tokens in the highest-yield pool.

        Args:
            token: Token to stake
            amount: Amount to stake
            min_apy: Minimum acceptable APY

        Returns:
            Execution result
        """
        intent = f"Stake {amount} {token} in highest-yield pool"
        if min_apy:
            intent += f" with minimum {min_apy}% APY"

        return await self.submit_intent(intent)

    async def mint_and_list_nft(
        self,
        metadata_url: str,
        chain: str,
        listing_price: str,
        marketplace: str = "OpenSea"
    ) -> Dict[str, Any]:
        """
        Mint an NFT and list it on a marketplace.

        Args:
            metadata_url: NFT metadata URL
            chain: Target blockchain
            listing_price: Listing price
            marketplace: Marketplace name

        Returns:
            Execution result
        """
        intent = (
            f"Mint NFT on {chain} (metadata: {metadata_url}), "
            f"list on {marketplace} for {listing_price}"
        )

        return await self.submit_intent(intent, params={
            "metadata_url": metadata_url,
            "marketplace": marketplace
        })

    async def bridge_tokens(
        self,
        token: str,
        amount: str,
        from_chain: str,
        to_chain: str
    ) -> Dict[str, Any]:
        """
        Bridge tokens between chains.

        Args:
            token: Token to bridge
            amount: Amount to bridge
            from_chain: Source chain
            to_chain: Destination chain

        Returns:
            Execution result
        """
        intent = f"Bridge {amount} {token} from {from_chain} to {to_chain}"
        return await self.submit_intent(intent)

    # ===== Utility Methods =====

    async def get_wallet_balance(
        self,
        token_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get wallet balance for ETH or a specific token"""

        if not self.account:
            return {"error": "No wallet configured"}

        try:
            if not token_address:
                # Get ETH balance
                balance = self.w3.eth.get_balance(self.account.address)
                return {
                    "address": self.account.address,
                    "balance": self.w3.from_wei(balance, "ether"),
                    "token": "ETH"
                }
            else:
                # Get ERC20 balance (simplified)
                # In production, would use proper ERC20 contract interface
                return {
                    "address": self.account.address,
                    "token_address": token_address,
                    "note": "ERC20 balance checking requires full implementation"
                }

        except Exception as e:
            logger.error(f"[ENSO] Error getting balance: {e}")
            return {"error": str(e)}

    async def estimate_gas(self, intent_string: str) -> Optional[int]:
        """Estimate gas cost for an intent"""

        try:
            intent_data = await self._parse_intent(intent_string, {})
            route = await self._get_enso_route(intent_data)

            if route:
                return route.get("estimatedGas")

            return None

        except Exception as e:
            logger.error(f"[ENSO] Error estimating gas: {e}")
            return None
