from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict

class OTOSequenceInput(BaseModel):
    """
    Input required to architect a multi-step OTO sequence.
    """
    core_product_details: Dict = Field(..., description="Details of the initial product being sold, including name and price.")
    available_offers_list: List = Field(..., description="A list of all available products that can be used as upsells or downsells, with names and prices.")
    max_oto_steps: int = Field(default=4, description="The maximum number of post-purchase offers to include in the sequence.")

class OTOFunnelMap(BaseModel):
    """
    A detailed, multi-branching flowchart for a complex OTO sequence.
    """
    funnel_flowchart: str = Field(..., description="A MermaidJS graph TD flowchart visualizing the entire OTO path, including 'YES' and 'NO' branches.")
    offer_details_per_step: List = Field(..., description="A list of dictionaries, where each dictionary details the offer at each step (e.g., OTO 1, OTO 2), its type (Upsell/Downsell), product name, price, and the logic for its presentation.")