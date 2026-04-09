from pydantic import BaseModel, Field

class FunnelEconomicsInput(BaseModel):
    """
    Input required to analyze the economics of a sales funnel.
    """
    total_sales_marketing_spend: float = Field(..., description="Total spend on sales and marketing for a specific period.")
    new_customers_acquired: int = Field(..., description="Number of new customers acquired during that same period.")
    average_purchase_value: float
    average_purchase_frequency: float = Field(..., description="Average number of purchases per customer per year.")
    average_customer_lifespan_years: float
    gross_margin_percentage: float = Field(..., description="The gross margin as a percentage (e.g., 60.0 for 60%).")

class FunnelEconomicsReport(BaseModel):
    """
    A report detailing the key economic metrics and health of a sales funnel.
    """
    customer_acquisition_cost_cac: float
    customer_lifetime_value_ltv: float
    ltv_cac_ratio: float
    ratio_health_assessment: str = Field(..., description="An assessment of the LTV:CAC ratio (e.g., 'Healthy and Scalable', 'Unsustainable', 'Underinvesting').")
    optimization_recommendations: List[str] = Field(..., description="Actionable recommendations to improve the LTV:CAC ratio.")