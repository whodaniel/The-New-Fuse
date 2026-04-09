"""
Layer 1: Autonomous Agent Core (The Orchestrator)
Coordinates execution across all 4 layers based on Decision Engine plans.
"""
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from .decision_engine import DecisionEngine, TaskLayer
from ..services import ArweaveMemoryService, ComputeService, EnsoService
from ..utils.logger import get_logger, AgentLogger

logger = get_logger(__name__)


class AutonomousAgent:
    """
    The core orchestrator. Takes a plan from the DecisionEngine
    and executes it step-by-step, coordinating all 4 layers.

    Architecture:
    - Layer 1 (Brain): Decision Engine + This Orchestrator
    - Layer 2 (Actions): ENSO Service
    - Layer 3 (Work): Compute Service (Akash + Render)
    - Layer 4 (Record): Memory Service (Arweave + AO)
    """

    def __init__(
        self,
        agent_id: str,
        enso: EnsoService,
        compute: ComputeService,
        memory: ArweaveMemoryService
    ):
        self.agent_id = agent_id
        self.decision_engine = DecisionEngine()

        # Inject service dependencies
        self.enso_service = enso
        self.compute_service = compute
        self.memory_service = memory

        # Task management
        self.task_queue: List[str] = []
        self.current_task: Optional[str] = None
        self.task_results: Dict[str, Any] = {}

        # State
        self.state = {
            "portfolio": {},
            "last_action": None,
            "total_tasks_completed": 0
        }

        # Specialized logger
        self.logger = AgentLogger(agent_id, "agent_core")

        self.logger.info(
            f"Agent Core {agent_id} is online",
            timestamp=datetime.now().isoformat()
        )

    def add_task(self, prompt: str):
        """
        Add a task to the agent's queue.

        Args:
            prompt: Natural language task description
        """
        self.logger.info(
            "New task received",
            prompt=prompt[:100]
        )
        self.task_queue.append(prompt)

    async def run_cycle(self):
        """
        Execute one cycle of the agent's main loop.
        Processes one task from the queue.
        """
        if not self.task_queue:
            self.logger.debug("No tasks in queue, cycle skipped")
            return

        # 1. Dequeue and Analyze
        prompt = self.task_queue.pop(0)
        self.current_task = prompt

        self.logger.info(
            "Starting task execution",
            prompt=prompt,
            queue_length=len(self.task_queue)
        )

        try:
            execution_plan = self.decision_engine.analyze_request(prompt)

            if not self.decision_engine.validate_plan(execution_plan):
                self.logger.error("Invalid execution plan generated")
                return

            # Log plan generation
            self.memory_service.save_log(
                self.agent_id,
                {
                    "event": "PLAN_GENERATED",
                    "prompt": prompt,
                    "plan": execution_plan,
                    "steps": len(execution_plan)
                }
            )

            # 2. Execute Plan
            results = await self._execute_plan(execution_plan)

            # 3. Update State
            self.state["last_action"] = prompt
            self.state["total_tasks_completed"] += 1

            # Save state to AO
            if results.get("success"):
                await self.memory_service.save_state_to_ao(
                    self.agent_id,
                    {
                        "state": self.state,
                        "last_task_results": results
                    }
                )

            self.logger.info(
                "Task cycle complete",
                success=results.get("success", False),
                steps_executed=len(results.get("step_results", []))
            )

        except Exception as e:
            self.logger.error(
                "Critical error in run cycle",
                error=str(e)
            )
            self.memory_service.save_log(
                self.agent_id,
                {
                    "event": "CYCLE_ERROR",
                    "error": str(e),
                    "prompt": prompt
                }
            )

        finally:
            self.current_task = None

    async def _execute_plan(self, plan: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute a multi-step plan across all layers.

        Args:
            plan: List of execution steps from Decision Engine

        Returns:
            Dictionary with overall results
        """
        self.logger.info(
            "Executing plan",
            steps=len(plan)
        )

        step_results = []
        context = {}  # Share data between steps

        for i, step in enumerate(plan):
            step_num = i + 1

            self.logger.info(
                f"Executing step {step_num}/{len(plan)}",
                layer=step['layer'],
                service=step['service'],
                task=step.get('task_type', 'unknown')
            )

            try:
                # Resolve placeholders from previous steps
                spec = self._resolve_placeholders(step.get('spec', {}), context)

                # Execute based on layer
                result = await self._execute_step(step, spec)

                # Log step completion
                self.memory_service.save_log(
                    self.agent_id,
                    {
                        "event": "STEP_COMPLETE",
                        "step": step_num,
                        "layer": step['layer'],
                        "service": step['service'],
                        "result": result
                    }
                )

                if result.get("status") in ["failed", "error"]:
                    self.logger.error(
                        f"Step {step_num} failed",
                        error=result.get("error")
                    )

                    self.memory_service.save_log(
                        self.agent_id,
                        {
                            "event": "PLAN_HALTED",
                            "step": step_num,
                            "error": result.get("error")
                        }
                    )

                    return {
                        "success": False,
                        "error": result.get("error"),
                        "failed_at_step": step_num,
                        "step_results": step_results
                    }

                # Update context with results
                if result.get("asset_url"):
                    context["ASSET_URL"] = result["asset_url"]

                if result.get("tx_hash"):
                    context["TX_HASH"] = result["tx_hash"]

                if result.get("nft_address"):
                    context["NFT_ADDRESS"] = result["nft_address"]

                step_results.append({
                    "step": step_num,
                    "description": step.get("description"),
                    "result": result
                })

            except Exception as e:
                self.logger.error(
                    f"Critical error on step {step_num}",
                    error=str(e)
                )

                self.memory_service.save_log(
                    self.agent_id,
                    {
                        "event": "CRITICAL_FAILURE",
                        "step": step_num,
                        "error": str(e)
                    }
                )

                return {
                    "success": False,
                    "error": str(e),
                    "failed_at_step": step_num,
                    "step_results": step_results
                }

        self.logger.info(
            "Plan execution complete",
            steps_completed=len(step_results)
        )

        return {
            "success": True,
            "steps_completed": len(step_results),
            "step_results": step_results,
            "context": context
        }

    async def _execute_step(
        self,
        step: Dict[str, Any],
        spec: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single step based on its layer"""

        layer = step["layer"]
        service = step["service"]
        task = step["task"]

        # Layer 3: Compute
        if layer == TaskLayer.L3_COMPUTE:
            if service == "Render":
                return await self.compute_service.dispatch_render_job(spec)
            elif service == "Akash":
                return await self.compute_service.dispatch_akash_job(spec)

        # Layer 2: Actions
        elif layer == TaskLayer.L2_ACTION:
            if task == "swap_tokens":
                return await self.enso_service.swap_tokens(
                    from_token=spec.get("from_token"),
                    to_token=spec.get("to_token"),
                    amount=spec.get("amount")
                )
            elif task == "stake_for_yield":
                return await self.enso_service.stake_for_yield(
                    token=spec.get("token"),
                    amount=spec.get("amount")
                )
            elif task == "bridge_tokens":
                return await self.enso_service.bridge_tokens(
                    token=spec.get("token"),
                    amount=spec.get("amount"),
                    from_chain=spec.get("from_chain"),
                    to_chain=spec.get("to_chain")
                )
            elif task == "mint_nft" or task == "mint_and_list_nft":
                return await self.enso_service.mint_and_list_nft(
                    metadata_url=spec.get("metadata_url"),
                    chain=spec.get("chain"),
                    listing_price=spec.get("listing_price", "100 USDC")
                )
            elif task == "submit_intent":
                # Generic intent
                return await self.enso_service.submit_intent(spec.get("intent"))

        return {"status": "error", "error": f"Unknown layer/service: {layer}/{service}"}

    def _resolve_placeholders(
        self,
        spec: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Resolve placeholder variables like ${ASSET_URL} from context"""

        resolved = {}

        for key, value in spec.items():
            if isinstance(value, str) and value.startswith("${"):
                placeholder = value[2:-1]  # Remove ${ and }
                resolved[key] = context.get(placeholder, value)
            else:
                resolved[key] = value

        return resolved

    # ===== Task Management Methods =====

    def get_task_status(self) -> Dict[str, Any]:
        """Get current task execution status"""
        return {
            "agent_id": self.agent_id,
            "current_task": self.current_task,
            "queue_length": len(self.task_queue),
            "state": self.state
        }

    async def cancel_current_task(self) -> bool:
        """Cancel the currently executing task"""
        if self.current_task:
            self.logger.warning("Cancelling current task", task=self.current_task)
            self.current_task = None
            return True
        return False

    def clear_queue(self):
        """Clear all pending tasks"""
        cleared = len(self.task_queue)
        self.task_queue.clear()
        self.logger.info("Queue cleared", tasks_cleared=cleared)

    # ===== State Management =====

    async def get_state(self) -> Dict[str, Any]:
        """Get current agent state"""
        return self.state

    async def update_state(self, updates: Dict[str, Any]):
        """Update agent state"""
        self.state.update(updates)
        await self.memory_service.save_state_to_ao(self.agent_id, {"state": self.state})

    # ===== Portfolio Management =====

    async def get_portfolio(self) -> Dict[str, Any]:
        """Get current portfolio holdings"""
        balance = await self.enso_service.get_wallet_balance()
        return {
            "wallet_address": self.enso_service.account.address if self.enso_service.account else None,
            "eth_balance": balance.get("balance"),
            "portfolio": self.state.get("portfolio", {})
        }
