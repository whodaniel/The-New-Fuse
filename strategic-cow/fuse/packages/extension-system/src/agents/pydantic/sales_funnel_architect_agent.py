from pydantic import BaseModel, Field

class SalesFunnelArchitectInput(BaseModel):
    """
    Input required to design a sales funnel.
    """
    product_to_sell: str = Field(..., description="The name of the primary product the funnel is designed to sell.")
    target_audience_summary: str = Field(..., description="A summary of the target customer.")

class FunnelStage(BaseModel):
    """
    Defines the strategy for a single stage of the sales funnel.
    """
    stage_name: str = Field(..., description="The name of the funnel stage (TOFU, MOFU, BOFU).")
    objective: str = Field(..., description="The primary goal of this stage.")
    tactics: list[str] = Field(..., description="The specific marketing tactics to be used in this stage.")

class SalesFunnelBlueprint(BaseModel):
    """
    A complete blueprint of the customer journey.
    """
    top_of_funnel_tofu: FunnelStage = Field(..., description="Strategy for generating Awareness.")
    middle_of_funnel_mofu: FunnelStage = Field(..., description="Strategy for building Interest and Consideration.")
    bottom_of_funnel_bofu: FunnelStage = Field(..., description="Strategy for driving the final Purchase.")