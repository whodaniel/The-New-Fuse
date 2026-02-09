from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class TechnicalSEO_AuditorInput(BaseModel):
    """
    Input required to perform a technical SEO audit.
    """
    blog_url: HttpUrl = Field(..., description="The root URL of the blog to audit.")

class AuditFinding(BaseModel):
    """
    Represents a single issue or status check found during the audit.
    """
    check_name: str = Field(..., description="The name of the audit check (e.g., 'Site Speed', 'Mobile-Friendliness').")
    status: Literal["Pass", "Fail", "Warning"] = Field(..., description="The result of the check.")
    details: str = Field(..., description="A detailed message explaining the finding and suggesting a fix if applicable.")

class TechnicalAuditReport(BaseModel):
    """
    The complete report of the technical SEO audit.
    """
    audited_url: HttpUrl = Field(..., description="The URL that was audited.")
    audit_date: str = Field(..., description="The date and time of the audit.")
    findings: List[AuditFinding] = Field(..., description="A list of all checks performed and their results.")
    sitemap_status: str = Field(..., description="Confirmation of XML sitemap generation and submission to search engines.")