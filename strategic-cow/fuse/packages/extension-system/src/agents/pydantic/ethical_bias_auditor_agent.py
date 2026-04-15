from pydantic import BaseModel, Field
from typing import List

class EthicalBiasInput(BaseModel):
    """
    Input for an ethical bias audit.
    """
    content_to_audit: str = Field(..., description="The AI-generated text or structured data to be audited.")
    content_context: str = Field(..., description="The context in which the content was generated (e.g., 'Blog post about finance').")

class BiasFinding(BaseModel):
    """
    Represents a single potential bias detected in the content.
    """
    bias_type: str = Field(..., description="The type of potential bias detected (e.g., 'Gender Bias', 'Racial Stereotyping', 'Socioeconomic Bias').")
    offending_snippet: str = Field(..., description="The specific text snippet that was flagged.")
    explanation: str = Field(..., description="An explanation of why this snippet is potentially biased.")

class EthicalBiasAuditReport(BaseModel):
    """
    A report detailing the findings of an ethical bias audit.
    """
    audit_status: str = Field(..., description="The overall result of the audit (e.g., 'Passed', 'Action Required').")
    findings: List[BiasFinding] = Field(..., description="A list of all potential biases detected.")
    remediation_recommendation: str = Field(..., description="A recommendation for how to remediate the findings, framed as a 'Model Rejection' of the biased output.")