from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class CustomerSupportInput(BaseModel):
    """
    Input required for the Customer Support Agent to process inquiries.
    """
    inquiry_source: Literal["email", "helpdesk", "social_media_dm", "product_comment"]
    inquiry_content: str = Field(..., description="The full content of the customer inquiry.")
    customer_id: str | None = Field(default=None, description="Optional: Unique identifier for the customer.")

class SupportResponse(BaseModel):
    """
    Represents a response generated for a customer inquiry.
    """
    response_type: Literal["automated_faq", "escalated_to_human", "direct_resolution"]
    response_text: str = Field(..., description="The text of the response or escalation note.")
    resolution_status: Literal["Open", "Pending", "Resolved"] = Field(default="Open")

class CustomerSupportReport(BaseModel):
    """
    A report summarizing the customer support interaction.
    """
    inquiry_id: str = Field(..., description="Unique ID for the inquiry.")
    customer_id: str | None
    inquiry_summary: str = Field(..., description="A brief summary of the customer's original inquiry.")
    support_responses: List[SupportResponse] = Field(..., description="A list of all responses and actions taken for this inquiry.")
    final_status: Literal["Open", "Resolved", "Escalated"]