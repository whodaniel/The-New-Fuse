from pydantic import BaseModel, Field
from typing import List, Dict

class FinancialManagerInput(BaseModel):
    """
    Input required to manage finances for a period.
    """
    income_streams: List[Dict[str, float]] = Field(..., description="A list of all income sources and amounts (e.g., [{'source': 'AdSense', 'amount': 550.75}]).")
    business_expenses: List[Dict[str, float]] = Field(..., description="A list of all business expenses and amounts (e.g., [{'item': 'Software Subscription', 'amount': 29.99}]).")

class ProfitAndLossStatement(BaseModel):
    """
    A simple profit and loss statement for a given period.
    """
    total_income: float
    total_expenses: float
    net_profit: float

class FinancialReport(BaseModel):
    """
    A report on the financial health of the business.
    """
    reporting_period: str = Field(..., description="The period this financial report covers.")
    profit_and_loss_statement: ProfitAndLossStatement
    financial_health_summary: str = Field(..., description="A brief summary of the business's financial health and key insights.")