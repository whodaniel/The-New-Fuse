from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Any

class LogicalReasoningInput(BaseModel):
    """
    Input for a structured problem-solving task.
    """
    problem_statement: str = Field(..., description="A complex, ill-defined problem to be analyzed.")
    framework_to_apply: str = Field(..., description="The specific logical framework to use (e.g., 'MECE Logic Tree', '5 Whys', 'Cynefin').")

class LogicalDecomposition(BaseModel):
    """
    The output of a structured analytical process.
    """
    framework_used: str
    analysis_summary: str = Field(..., description="A summary of how the framework was applied.")
    structured_output: Dict[str, Any] = Field(..., description="The structured output of the analysis, e.g., the nodes of a logic tree, the result of a 5 Whys analysis, or a Cynefin classification.")
    next_steps_recommendation: str = Field(..., description="A recommendation for how to proceed with the decomposed problem.")