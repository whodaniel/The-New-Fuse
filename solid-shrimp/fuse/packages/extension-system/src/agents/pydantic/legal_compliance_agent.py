from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class LegalComplianceInput(BaseModel):
    """
    Input required to perform a legal compliance audit.
    """
    website_urls: List[HttpUrl]
    content_for_review: List[dict] = Field(..., description="A list of content pieces (e.g., blog posts, video descriptions) to check for FTC compliance.")
    copyright_claims: List[dict] = Field(..., description="A list of any active YouTube Content ID claims or copyright strikes.")

class ComplianceCheckResult(BaseModel):
    """
    The result of a single compliance check.
    """
    area: Literal["Website Legal Pages", "FTC Disclosure", "Intellectual Property"]
    status: Literal["Pass", "Fail", "Action Required"]
    details: str

class LegalComplianceAuditReport(BaseModel):
    """
    A report summarizing the legal compliance audit of the business.
    """
    audit_results: List[ComplianceCheckResult]