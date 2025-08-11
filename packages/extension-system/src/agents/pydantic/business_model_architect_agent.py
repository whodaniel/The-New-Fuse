from pydantic import BaseModel, Field
from typing import Literal

class BusinessModelArchitectInput(BaseModel):
    """
    Input required to define the e-commerce business model.
    """
    creator_goals: str = Field(..., description="A summary of the creator's overall business goals.")
    product_offerings: str = Field(..., description="A description of the planned products or services to be sold.")

class BusinessModelDefinition(BaseModel):
    """
    A definition of the selected e-commerce business model.
    """
    selected_model: Literal["B2C", "B2B", "Hybrid"] = Field(..., description="The selected business model (Business-to-Consumer or Business-to-Business).")
    justification: str = Field(..., description="The rationale for selecting this model based on the creator's goals and product offerings.")
    implementation_strategy: str = Field(..., description="A high-level strategy for implementing this business model.")