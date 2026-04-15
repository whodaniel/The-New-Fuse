from pydantic import BaseModel, Field, UUID4, HttpUrl
from typing import List, Dict, Any, Literal, Union
from uuid import uuid4
from datetime import datetime

# Import all other agent output models here, e.g.:
from niche_analyst_agent import NicheAnalysisReport
from audience_persona_architect_agent import AudiencePersona
# ... and so on for all other agents

class Task(BaseModel):
    """
    Represents a single task to be executed by a sub-agent.
    """
    task_id: UUID4 = Field(default_factory=uuid4)
    agent_name: str = Field(..., description="The name of the sub-agent to execute the task, e.g., 'niche-analyst-agent'.")
    input_data: Dict[str, Any] = Field(..., description="The input data for the agent, conforming to its input Pydantic model.")
    status: Literal["pending", "in_progress", "completed", "failed"] = "pending"
    dependencies: List[UUID4] = Field(default_factory=list, description="A list of task_ids that must be completed before this task can start.")
    output: Union[Any, None] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Union[datetime, None] = None

class ProjectPlan(BaseModel):
    """
    A structured plan of tasks to achieve a high-level goal.
    """
    project_id: UUID4 = Field(default_factory=uuid4)
    goal: str = Field(..., description="The high-level user goal.")
    tasks: List[Task] = Field(..., description="The sequence of tasks required to achieve the goal.")

class OrchestratorState(BaseModel):
    """
    The internal state of the OrchestratorAgent, tracking all ongoing projects.
    """
    active_projects: List[ProjectPlan] = Field(default_factory=list)
    completed_projects: List[ProjectPlan] = Field(default_factory=list)
    agent_registry: Dict[str, Any] = Field(..., description="A registry of all available sub-agents and their capabilities.")

class OrchestratorOutput(BaseModel):
    """
    The output of the OrchestratorAgent, typically a status update or final result.
    """
    project_id: UUID4
    status: Literal["in_progress", "completed", "failed"]
    message: str
    final_deliverable_url: Union[HttpUrl, None] = None