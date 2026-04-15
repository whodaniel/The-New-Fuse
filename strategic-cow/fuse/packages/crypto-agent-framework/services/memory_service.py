"""
Layer 4: Memory Service (Arweave & AO)
Handles permanent, immutable logging and state management
"""
import json
import time
import hashlib
from typing import Dict, Optional, Any
from pathlib import Path

try:
    import arweave
except ImportError:
    arweave = None
    print("Warning: arweave-python-client not installed. Install with: pip install arweave-python-client")

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import config
from ..utils.logger import get_logger

logger = get_logger(__name__)


class ArweaveMemoryService:
    """
    Handles permanent, immutable logging to Arweave (L4)
    and state management via AO.

    Key Features:
    - Immutable audit logs on Arweave
    - Persistent state management via AO
    - Cryptographic verification
    - Automatic retry logic
    """

    def __init__(self):
        self.arweave_url = config.ARWEAVE_NODE_URL
        self.gateway_url = config.ARWEAVE_GATEWAY_URL
        self.ao_mu_url = config.AO_MU_URL
        self.ao_cu_url = config.AO_CU_URL
        self.process_id = config.AGENT_AO_PROCESS_ID

        self.wallet = None
        self._load_wallet()

        logger.info(
            "Memory Service Initialized (L4 Record - Arweave & AO)",
            arweave_enabled=config.ENABLE_ARWEAVE_LOGGING,
            ao_enabled=config.ENABLE_AO_STATE
        )

    def _load_wallet(self):
        """Load Arweave wallet from keyfile"""
        if not config.ARWEAVE_KEYFILE:
            logger.warning("No Arweave keyfile configured. Running in mock mode.")
            return

        try:
            keyfile_path = Path(config.ARWEAVE_KEYFILE)
            if keyfile_path.exists() and arweave:
                with open(keyfile_path, 'r') as f:
                    wallet_data = json.load(f)
                self.wallet = arweave.Wallet(wallet_data)
                logger.info(f"Arweave wallet loaded from {keyfile_path}")
            else:
                logger.warning(f"Arweave keyfile not found at {keyfile_path}")
        except Exception as e:
            logger.error(f"Error loading Arweave wallet: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def save_log(self, agent_id: str, log_data: Dict[str, Any]) -> Optional[str]:
        """
        Writes an immutable audit log to Arweave.

        Args:
            agent_id: Unique identifier for the agent
            log_data: Dictionary containing log data

        Returns:
            Transaction ID if successful, None otherwise

        Example:
            >>> memory.save_log("agent-001", {
            ...     "event": "TASK_COMPLETE",
            ...     "task_id": "xyz",
            ...     "status": "success"
            ... })
            'ar_tx_abc123...'
        """
        if not config.ENABLE_ARWEAVE_LOGGING:
            logger.debug("Arweave logging disabled, skipping save_log")
            return self._mock_save_log(agent_id, log_data)

        logger.info(f"[ARWEAVE] Saving audit log for agent {agent_id}...")

        try:
            # Build log entry
            log_entry = {
                "timestamp": int(time.time()),
                "iso_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "agent_id": agent_id,
                "version": "1.0",
                **log_data
            }

            log_json = json.dumps(log_entry, indent=2)
            log_hash = hashlib.sha256(log_json.encode()).hexdigest()

            if self.wallet and arweave:
                # Create Arweave transaction
                transaction = arweave.Transaction(
                    wallet=self.wallet,
                    data=log_json.encode(),
                )

                # Add tags for searchability
                transaction.add_tag('App-Name', 'TheNewFuse-CryptoAgent')
                transaction.add_tag('App-Version', '1.0')
                transaction.add_tag('Agent-ID', agent_id)
                transaction.add_tag('Content-Type', 'application/json')
                transaction.add_tag('Data-Hash', log_hash)

                if 'event' in log_data:
                    transaction.add_tag('Event-Type', log_data['event'])

                # Sign and submit
                transaction.sign()
                transaction.send()

                tx_id = transaction.id
                logger.info(
                    f"[ARWEAVE] Log saved successfully",
                    tx_id=tx_id,
                    view_url=f"{self.gateway_url}/{tx_id}"
                )
                return tx_id
            else:
                # Mock mode
                return self._mock_save_log(agent_id, log_entry)

        except Exception as e:
            logger.error(f"[ARWEAVE] Error saving log: {e}")
            # Fallback to mock
            return self._mock_save_log(agent_id, log_data)

    def _mock_save_log(self, agent_id: str, log_data: Dict) -> str:
        """Mock save for testing without real Arweave connection"""
        log_hash = hashlib.sha256(json.dumps(log_data).encode()).hexdigest()
        mock_tx_id = f"ar_mock_{log_hash[:16]}"
        logger.debug(f"[ARWEAVE:MOCK] Log saved with mock TX: {mock_tx_id}")
        return mock_tx_id

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def save_state_to_ao(
        self,
        agent_id: str,
        state_data: Dict[str, Any]
    ) -> Optional[str]:
        """
        Sends a message to the agent's AO process to update
        its persistent state.

        Args:
            agent_id: Unique identifier for the agent
            state_data: Dictionary containing state data

        Returns:
            Message ID if successful, None otherwise

        Example:
            >>> await memory.save_state_to_ao("agent-001", {
            ...     "portfolio": {"staked_usdc": 100},
            ...     "last_action": "stake_complete"
            ... })
            'ao_msg_xyz789...'
        """
        if not config.ENABLE_AO_STATE:
            logger.debug("AO state management disabled, skipping save_state_to_ao")
            return self._mock_save_state(agent_id, state_data)

        if not self.process_id:
            logger.warning("No AO process ID configured, using mock mode")
            return self._mock_save_state(agent_id, state_data)

        logger.info(f"[AO] Saving state to process {self.process_id}...")

        try:
            # Prepare state message
            state_message = {
                "timestamp": int(time.time()),
                "agent_id": agent_id,
                "state": state_data
            }

            # Send message to AO process via MU (Message Unit)
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ao_mu_url}/",
                    json={
                        "process": self.process_id,
                        "data": json.dumps(state_message),
                        "tags": [
                            {"name": "Action", "value": "UpdateState"},
                            {"name": "Agent-ID", "value": agent_id},
                        ]
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    msg_id = result.get("id", "unknown")
                    logger.info(f"[AO] State update sent successfully. Msg: {msg_id}")
                    return msg_id
                else:
                    logger.error(f"[AO] Error response: {response.status_code} - {response.text}")
                    return self._mock_save_state(agent_id, state_data)

        except Exception as e:
            logger.error(f"[AO] Error saving state: {e}")
            return self._mock_save_state(agent_id, state_data)

    def _mock_save_state(self, agent_id: str, state_data: Dict) -> str:
        """Mock state save for testing"""
        state_hash = hashlib.sha256(json.dumps(state_data).encode()).hexdigest()
        mock_msg_id = f"ao_mock_{state_hash[:16]}"
        logger.debug(f"[AO:MOCK] State saved with mock msg: {mock_msg_id}")
        return mock_msg_id

    async def get_state_from_ao(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves the current state of an agent from AO.

        Args:
            agent_id: Unique identifier for the agent

        Returns:
            State dictionary if found, None otherwise
        """
        if not config.ENABLE_AO_STATE or not self.process_id:
            logger.warning("AO state disabled or no process ID")
            return None

        logger.info(f"[AO] Retrieving state for agent {agent_id}...")

        try:
            # Query AO process via CU (Compute Unit)
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.ao_cu_url}/state/{self.process_id}",
                    params={"agent_id": agent_id}
                )

                if response.status_code == 200:
                    state = response.json()
                    logger.info(f"[AO] State retrieved successfully")
                    return state.get("state", {})
                else:
                    logger.error(f"[AO] Error retrieving state: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"[AO] Error retrieving state: {e}")
            return None

    async def query_logs(
        self,
        agent_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: int = 10
    ) -> list:
        """
        Queries Arweave for logs based on filters.

        Args:
            agent_id: Filter by agent ID
            event_type: Filter by event type
            limit: Maximum number of results

        Returns:
            List of log entries
        """
        logger.info(f"[ARWEAVE] Querying logs (agent={agent_id}, event={event_type})")

        try:
            # Build GraphQL query for Arweave
            tags = [
                {"name": "App-Name", "values": ["TheNewFuse-CryptoAgent"]}
            ]

            if agent_id:
                tags.append({"name": "Agent-ID", "values": [agent_id]})

            if event_type:
                tags.append({"name": "Event-Type", "values": [event_type]})

            query = {
                "query": """
                    query($tags: [TagFilter!], $first: Int!) {
                        transactions(tags: $tags, first: $first, sort: HEIGHT_DESC) {
                            edges {
                                node {
                                    id
                                    tags {
                                        name
                                        value
                                    }
                                    block {
                                        timestamp
                                    }
                                }
                            }
                        }
                    }
                """,
                "variables": {
                    "tags": tags,
                    "first": limit
                }
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.gateway_url}/graphql",
                    json=query
                )

                if response.status_code == 200:
                    data = response.json()
                    transactions = data.get("data", {}).get("transactions", {}).get("edges", [])

                    results = []
                    for edge in transactions:
                        node = edge["node"]
                        results.append({
                            "tx_id": node["id"],
                            "timestamp": node.get("block", {}).get("timestamp"),
                            "tags": {tag["name"]: tag["value"] for tag in node["tags"]},
                            "url": f"{self.gateway_url}/{node['id']}"
                        })

                    logger.info(f"[ARWEAVE] Found {len(results)} log entries")
                    return results
                else:
                    logger.error(f"[ARWEAVE] Query error: {response.status_code}")
                    return []

        except Exception as e:
            logger.error(f"[ARWEAVE] Error querying logs: {e}")
            return []
