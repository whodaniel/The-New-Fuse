from pydantic import BaseModel, Field
from typing import List, Literal

class CampaignExecutionInput(BaseModel):
    """
    Input required to manage a sponsored campaign.
    """
    contract: dict = Field(..., description="The executed contract outlining all obligations.")

class DeliverableStatus(BaseModel):
    """
    The status of a single campaign deliverable.
    """
    deliverable_name: str
    due_date: str
    status: Literal["Pending", "In Progress", "Submitted for Approval", "Approved", "Published"]

class CampaignExecutionReport(BaseModel):
    """
    A report tracking the status of all campaign deliverables.
    """
    campaign_name: str
    deliverable_statuses: List[DeliverableStatus]