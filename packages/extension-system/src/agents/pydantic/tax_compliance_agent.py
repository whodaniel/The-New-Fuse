from pydantic import BaseModel, Field
from typing import List

class TaxComplianceInput(BaseModel):
    """
    Input required to manage tax compliance.
    """
    financial_report: dict = Field(..., description="The complete financial report from the FinancialManagerAgent.")

class TaxSummaryReport(BaseModel):
    """
    A report summarizing the creator's tax obligations for a period.
    """
    total_income: float
    total_deductible_expenses: float = Field(..., description="All tracked business expenses that qualify as tax write-offs.")
    estimated_taxable_income: float
    estimated_tax_liability: float
    amount_to_set_aside: float = Field(..., description="The amount of income (typically 30-35%) to set aside for tax payments.")
    quarterly_estimated_tax_status: str = Field(..., description="The status of the upcoming quarterly estimated tax payment.")