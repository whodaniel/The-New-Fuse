#!/usr/bin/env python3
"""
Main entry point for the 4-Layer Crypto AI Agent Framework

This script initializes and runs the autonomous agent in standalone mode.
For Fetch.ai uAgents integration, see agent_host_fetch.py
For API integration with The New Fuse, see the TypeScript bridge.

Usage:
    python main.py [--task "your task here"] [--loop] [--interval 60]

Examples:
    # Single task execution
    python main.py --task "Generate a 3D model of a red sports car"

    # Continuous loop mode
    python main.py --loop --interval 30

    # Interactive mode (default)
    python main.py
"""
import asyncio
import argparse
import signal
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import config
from agent import AutonomousAgent
from services import EnsoService, ComputeService, ArweaveMemoryService
from utils.logger import get_logger

logger = get_logger(__name__)


class AgentRunner:
    """Manages the agent lifecycle in standalone mode"""

    def __init__(self, agent_id: str = None):
        self.agent_id = agent_id or config.AGENT_ID
        self.agent = None
        self.running = False

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("Shutdown signal received, cleaning up...")
        self.running = False

    async def initialize(self):
        """Initialize all services and the agent"""
        logger.info(
            "=== Initializing 4-Layer Crypto AI Agent Framework ===",
            agent_id=self.agent_id
        )

        # Validate configuration
        if not config.validate():
            logger.error("Configuration validation failed!")
            sys.exit(1)

        # 1. Initialize all services
        logger.info("Initializing services...")

        enso = EnsoService()
        compute = ComputeService()
        memory = ArweaveMemoryService()

        # 2. Initialize the Agent Core and inject services
        logger.info("Initializing Agent Core...")

        self.agent = AutonomousAgent(
            agent_id=self.agent_id,
            enso=enso,
            compute=compute,
            memory=memory
        )

        logger.info(
            "Agent initialized successfully",
            agent_id=self.agent_id
        )

    async def run_single_task(self, task: str):
        """Execute a single task and exit"""
        logger.info(
            "Running single task mode",
            task=task
        )

        self.agent.add_task(task)
        await self.agent.run_cycle()

        logger.info("Task execution complete")

    async def run_interactive(self):
        """Run in interactive mode with user input"""
        logger.info("Starting interactive mode (Ctrl+C to exit)")

        print("\n" + "="*60)
        print("  4-Layer Crypto AI Agent Framework - Interactive Mode")
        print("="*60)
        print(f"\nAgent ID: {self.agent_id}")
        print("\nEnter tasks for the agent to execute.")
        print("Type 'exit' or press Ctrl+C to quit.\n")

        self.running = True

        while self.running:
            try:
                # Get user input
                task = await asyncio.get_event_loop().run_in_executor(
                    None,
                    input,
                    "\n[TASK] > "
                )

                task = task.strip()

                if task.lower() in ['exit', 'quit', 'q']:
                    break

                if not task:
                    continue

                # Execute task
                self.agent.add_task(task)
                await self.agent.run_cycle()

                # Show status
                status = self.agent.get_task_status()
                print(f"\n[STATUS] Tasks completed: {status['state']['total_tasks_completed']}")

            except EOFError:
                break
            except Exception as e:
                logger.error(f"Error in interactive loop: {e}")

        logger.info("Interactive mode ended")

    async def run_loop(self, interval: int = 60):
        """Run in continuous loop mode"""
        logger.info(
            "Starting loop mode",
            interval_seconds=interval
        )

        print("\n" + "="*60)
        print("  4-Layer Crypto AI Agent Framework - Loop Mode")
        print("="*60)
        print(f"\nAgent ID: {self.agent_id}")
        print(f"Checking for tasks every {interval} seconds")
        print("Press Ctrl+C to stop.\n")

        self.running = True

        while self.running:
            try:
                await self.agent.run_cycle()

                status = self.agent.get_task_status()
                logger.info(
                    "Cycle complete",
                    queue_length=status['queue_length'],
                    total_completed=status['state']['total_tasks_completed']
                )

                await asyncio.sleep(interval)

            except Exception as e:
                logger.error(f"Error in loop: {e}")
                await asyncio.sleep(5)  # Brief pause before retry

        logger.info("Loop mode ended")

    async def cleanup(self):
        """Cleanup resources"""
        logger.info("Cleaning up resources...")

        if self.agent:
            # Save final state
            try:
                await self.agent.memory_service.save_state_to_ao(
                    self.agent_id,
                    {
                        "event": "AGENT_SHUTDOWN",
                        "state": self.agent.state
                    }
                )
            except Exception as e:
                logger.error(f"Error saving final state: {e}")

        logger.info("Cleanup complete")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="4-Layer Crypto AI Agent Framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode
  python main.py

  # Single task
  python main.py --task "Swap 10 ETH for USDC"

  # Loop mode
  python main.py --loop --interval 30

  # Custom agent ID
  python main.py --agent-id my-agent-001
        """
    )

    parser.add_argument(
        "--task",
        type=str,
        help="Execute a single task and exit"
    )

    parser.add_argument(
        "--loop",
        action="store_true",
        help="Run in continuous loop mode"
    )

    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Loop interval in seconds (default: 60)"
    )

    parser.add_argument(
        "--agent-id",
        type=str,
        help="Custom agent ID (default from config)"
    )

    args = parser.parse_args()

    # Create runner
    runner = AgentRunner(agent_id=args.agent_id)

    try:
        # Initialize
        await runner.initialize()

        # Run based on mode
        if args.task:
            await runner.run_single_task(args.task)
        elif args.loop:
            await runner.run_loop(interval=args.interval)
        else:
            await runner.run_interactive()

    except KeyboardInterrupt:
        logger.info("Interrupted by user")

    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)

    finally:
        await runner.cleanup()


if __name__ == "__main__":
    # Run the async main function
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nShutdown complete.")
