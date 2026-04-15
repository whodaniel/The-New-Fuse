"""
Structured logging utility for the crypto agent framework
"""
import logging
import sys
from typing import Any, Dict
import structlog
from pathlib import Path

from ..config import config

# Configure standard library logging
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
)

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.dev.ConsoleRenderer() if sys.stdout.isatty() else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)


def get_logger(name: str = __name__):
    """
    Get a structured logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured structlog logger

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Task started", task_id="xyz", agent_id="001")
    """
    return structlog.get_logger(name)


class AgentLogger:
    """
    Specialized logger for agent operations with context management
    """

    def __init__(self, agent_id: str, logger_name: str = "agent"):
        self.agent_id = agent_id
        self.logger = get_logger(logger_name)
        self.context = {"agent_id": agent_id}

    def bind(self, **kwargs):
        """Add context to the logger"""
        self.context.update(kwargs)
        return self

    def unbind(self, *keys):
        """Remove context from the logger"""
        for key in keys:
            self.context.pop(key, None)
        return self

    def _log(self, level: str, event: str, **kwargs):
        """Internal logging method"""
        log_method = getattr(self.logger, level)
        log_method(event, **{**self.context, **kwargs})

    def debug(self, event: str, **kwargs):
        self._log("debug", event, **kwargs)

    def info(self, event: str, **kwargs):
        self._log("info", event, **kwargs)

    def warning(self, event: str, **kwargs):
        self._log("warning", event, **kwargs)

    def error(self, event: str, **kwargs):
        self._log("error", event, **kwargs)

    def critical(self, event: str, **kwargs):
        self._log("critical", event, **kwargs)
