#!/usr/bin/env python3
"""
Fetch.ai uAgents Integration
Wraps the 4-Layer Agent Core to run on the Fetch.ai agent network.

This enables:
- P2P agent communication
- Mailbox messaging
- Agent registration on Almanac
- Integration with Fetch.ai ecosystem
"""
import asyncio
from typing import Optional

try:
    from uagents import Agent, Context, Model
    from uagents.setup import fund_agent_if_low
    UAGENTS_AVAILABLE = True
except ImportError:
    UAGENTS_AVAILABLE = False
    print("Warning: uagents not installed. Install with: pip install uagents")
    print("Falling back to standalone mode.")

from config import config
from agent import AutonomousAgent
from services import EnsoService, ComputeService, ArweaveMemoryService
from utils.logger import get_logger

logger = get_logger(__name__)


# ===== Message Models =====

class TaskRequest(Model):
    """Message model for receiving tasks from other agents or users"""
    prompt: str
    priority: Optional[int] = 1
    requester: Optional[str] = None


class TaskResponse(Model):
    """Message model for responding with task results"""
    task_id: str
    status: str
    result: dict
    agent_id: str


class AgentStatus(Model):
    """Message model for status queries"""
    agent_id: str
    queue_length: int
    current_task: Optional[str]
    total_completed: int


# ===== Service Initialization =====

logger.info("Initializing 4-Layer Agent Services...")

# Initialize services as singletons
ENSO_SERVICE = EnsoService()
COMPUTE_SERVICE = ComputeService()
MEMORY_SERVICE = ArweaveMemoryService()

# Initialize the Core Agent Orchestrator
CORE_AGENT = AutonomousAgent(
    agent_id=config.AGENT_ID,
    enso=ENSO_SERVICE,
    compute=COMPUTE_SERVICE,
    memory=MEMORY_SERVICE
)

logger.info(
    "Core agent initialized",
    agent_id=config.AGENT_ID
)


# ===== Fetch.ai uAgent Setup =====

if UAGENTS_AVAILABLE:
    # Create the Fetch.ai uAgent
    uagent = Agent(
        name=config.AGENT_NAME or "crypto_agent",
        seed=config.UAGENTS_SEED_PHRASE or config.AGENT_ID,
        port=8001,
        endpoint=["http://localhost:8001/submit"],
        mailbox=config.UAGENTS_MAILBOX_KEY
    )

    logger.info(
        "Fetch.ai uAgent created",
        name=uagent.name,
        address=uagent.address
    )

    # Fund agent if needed (testnet)
    fund_agent_if_low(uagent.wallet.address())


    # ===== Message Handlers =====

    @uagent.on_message(model=TaskRequest)
    async def handle_task_request(ctx: Context, sender: str, msg: TaskRequest):
        """
        Handle incoming task requests from other agents or users.

        This is the main entry point for agent-to-agent communication.
        """
        ctx.logger.info(
            f"Received task from {sender}",
            prompt=msg.prompt[:100],
            priority=msg.priority
        )

        # Add task to core agent's queue
        CORE_AGENT.add_task(msg.prompt)

        # Acknowledge receipt
        await ctx.send(
            sender,
            TaskResponse(
                task_id=f"task_{hash(msg.prompt)}",
                status="queued",
                result={"message": "Task added to queue"},
                agent_id=config.AGENT_ID
            )
        )


    @uagent.on_query(model=AgentStatus)
    async def handle_status_query(ctx: Context, sender: str, _msg: AgentStatus):
        """
        Handle status queries from other agents.
        """
        status = CORE_AGENT.get_task_status()

        return AgentStatus(
            agent_id=config.AGENT_ID,
            queue_length=status['queue_length'],
            current_task=status['current_task'],
            total_completed=status['state']['total_tasks_completed']
        )


    @uagent.on_interval(period=10.0)
    async def run_core_cycle(ctx: Context):
        """
        Main execution loop - runs the core agent's cycle periodically.

        This processes tasks from the queue and coordinates
        execution across all 4 layers.
        """
        ctx.logger.debug("Running agent execution cycle...")

        try:
            await CORE_AGENT.run_cycle()

            # Log status
            status = CORE_AGENT.get_task_status()
            if status['current_task'] or status['queue_length'] > 0:
                ctx.logger.info(
                    "Cycle complete",
                    queue_length=status['queue_length'],
                    total_completed=status['state']['total_tasks_completed']
                )

        except Exception as e:
            ctx.logger.error(f"Error in execution cycle: {e}")


    @uagent.on_event("startup")
    async def on_startup(ctx: Context):
        """Handle agent startup"""
        ctx.logger.info(
            "Agent startup complete",
            agent_id=config.AGENT_ID,
            address=uagent.address,
            layers="L1 (Brain) + L2 (ENSO) + L3 (Compute) + L4 (Memory)"
        )

        # Save startup event to Arweave
        MEMORY_SERVICE.save_log(
            config.AGENT_ID,
            {
                "event": "AGENT_STARTUP",
                "agent_address": uagent.address,
                "timestamp": ctx.timestamp
            }
        )


    @uagent.on_event("shutdown")
    async def on_shutdown(ctx: Context):
        """Handle agent shutdown"""
        ctx.logger.info("Agent shutting down...")

        # Save final state
        try:
            await MEMORY_SERVICE.save_state_to_ao(
                config.AGENT_ID,
                {
                    "event": "AGENT_SHUTDOWN",
                    "state": CORE_AGENT.state,
                    "timestamp": ctx.timestamp
                }
            )
        except Exception as e:
            ctx.logger.error(f"Error saving final state: {e}")


    # ===== Custom Message Types for Multi-Agent Collaboration =====

    class CollaborationRequest(Model):
        """Request collaboration from another crypto agent"""
        task_type: str
        parameters: dict
        requester_address: str


    @uagent.on_message(model=CollaborationRequest)
    async def handle_collaboration(ctx: Context, sender: str, msg: CollaborationRequest):
        """
        Handle collaboration requests from other crypto agents.

        This enables multi-agent workflows where agents can delegate
        specific tasks to specialized agents.
        """
        ctx.logger.info(
            f"Collaboration request from {sender}",
            task_type=msg.task_type
        )

        # Process based on task type
        if msg.task_type == "estimate_gas":
            # Estimate gas for an intent
            estimated_gas = await ENSO_SERVICE.estimate_gas(
                msg.parameters.get("intent", "")
            )

            await ctx.send(
                sender,
                TaskResponse(
                    task_id=f"collab_{hash(str(msg.parameters))}",
                    status="completed",
                    result={"estimated_gas": estimated_gas},
                    agent_id=config.AGENT_ID
                )
            )

        elif msg.task_type == "portfolio_status":
            # Get portfolio status
            portfolio = await CORE_AGENT.get_portfolio()

            await ctx.send(
                sender,
                TaskResponse(
                    task_id=f"collab_{hash(str(msg.parameters))}",
                    status="completed",
                    result=portfolio,
                    agent_id=config.AGENT_ID
                )
            )


    def main():
        """Main entry point when running as Fetch.ai agent"""
        print("\n" + "="*70)
        print("  4-Layer Crypto AI Agent - Fetch.ai Network Mode")
        print("="*70)
        print(f"\nAgent Name: {uagent.name}")
        print(f"Agent Address: {uagent.address}")
        print(f"Agent ID: {config.AGENT_ID}")
        print(f"\nLayers:")
        print(f"  L1 (Brain): Decision Engine + Orchestrator")
        print(f"  L2 (Actions): ENSO Protocol")
        print(f"  L3 (Compute): Akash + Render Network")
        print(f"  L4 (Memory): Arweave + AO")
        print(f"\nPress Ctrl+C to stop.\n")
        print("="*70 + "\n")

        uagent.run()


    if __name__ == "__main__":
        main()

else:
    # Fallback when uagents not available
    def main():
        print("\n" + "="*70)
        print("  ERROR: Fetch.ai uAgents not installed")
        print("="*70)
        print("\nTo use Fetch.ai integration, install uagents:")
        print("  pip install uagents")
        print("\nOr run in standalone mode:")
        print("  python main.py")
        print("="*70 + "\n")


    if __name__ == "__main__":
        main()
