import logging
import time
from typing import List, Optional

class GDesignerAdapter:
    def __init__(self):
        self.logger = logging.getLogger("GDesigner")
        self.metrics = MetricsCollector()
        self.task_lock = asyncio.Lock()
        self.team_cache = ExpiringCache(ttl=300)  # 5-minute TTL
        self.message_queue = AsyncMessageQueue(
            max_size=1000,
            backpressure_strategy=BackpressureStrategy.WINDOWED_DROP,
            on_overflow=self._handle_queue_overflow
        )

    async def _handle_queue_overflow(self, dropped_messages: List[Message]):
        """Enhanced overflow handling with debugging"""
        self.logger.debug(
            f"Queue overflow detected: {len(dropped_messages)} messages dropped",
            extra={
                "queue_size": self.message_queue.size,
                "drop_reason": "backpressure",
                "timestamp": time.time()
            }
        )
        await self.metrics.record_overflow_event(dropped_messages)

    async def get_team_lazy(self, team_id: str) -> Team:
        """Cached team loading with capability-based prefetching"""
        if team := self.team_cache.get(team_id):
            return team
            
        team = await self.load_team(team_id)
        self.team_cache.set(team_id, team)
        
        # Prefetch related capabilities
        asyncio.create_task(self.prefetch_team_capabilities(team))
        return team

    async def process_task(self, task: Task, team_id: Optional[str] = None) -> TaskResult:
        """Production-ready task processing with full monitoring"""
        async with self.task_lock:
            start_time = time.time()
            
            try:
                team = await self.get_team_lazy(team_id) if team_id else await self.create_optimal_team(task)
                
                async with ResourceManager() as rm:
                    processors = [
                        self.process_subtask_with_monitoring(subtask, self.message_queue)
                        for subtask in task.get_subtasks()
                    ]
                    
                    results = await asyncio.gather(*processors)
                    metrics = await rm.get_metrics()
                
                processing_time = time.time() - start_time
                await self.metrics.record_task_metrics(task.id, processing_time, metrics)
                
                return TaskResult.aggregate(results, metrics)
                
            except Exception as e:
                self.logger.error(f"Task processing error: {str(e)}", exc_info=True)
                await self.metrics.record_error(task.id, e)
                raise
