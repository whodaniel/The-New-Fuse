from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class AdNetworkManagerInput(BaseModel):
    """
    Input required to manage application to an ad network.
    """
    blog_url: HttpUrl = Field(..., description="The URL of the blog applying for ads.")
    about_page_url: HttpUrl = Field(..., description="URL to the 'About' page.")
    contact_page_url: HttpUrl = Field(..., description="URL to the 'Contact' page.")
    privacy_policy_url: HttpUrl = Field(..., description="URL to the 'Privacy Policy' page.")
    content_quality_score: float = Field(..., ge=0.0, le=1.0, description="A score representing the quality and sufficiency of content on the blog.")

class EligibilityCheck(BaseModel):
    """
    Represents a single eligibility check for an ad network.
    """
    requirement: str = Field(..., description="The specific requirement being checked.")
    status: Literal["Pass", "Fail"] = Field(..., description="The result of the check.")
    details: str = Field(..., description="Details on the check's outcome.")

class AdNetworkApplicationReport(BaseModel):
    """
    A report detailing the blog's eligibility for an ad network and the application status.
    """
    target_network: str = Field(default="Google AdSense", description="The ad network being applied to.")
    eligibility_checklist: List[EligibilityCheck] = Field(..., description="A list of all eligibility checks performed.")
    application_status: str = Field(..., description="The final status of the application (e.g., 'Pre-checks Passed, Application Submitted').")