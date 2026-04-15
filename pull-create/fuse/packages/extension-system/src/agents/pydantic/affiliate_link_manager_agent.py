from pydantic import BaseModel, Field, HttpUrl
from typing import List

class AffiliateLinkManagerInput(BaseModel):
    """
    Input required to manage affiliate links.
    """
    niche: str = Field(..., description="The blog's niche.")
    post_content_url: HttpUrl = Field(..., description="The URL of a specific blog post to insert links into.")
    post_content_text: str = Field(..., description="The text of the blog post.")

class AffiliateProduct(BaseModel):
    """
    Represents a relevant affiliate product.
    """
    product_name: str = Field(..., description="The name of the product.")
    affiliate_program: str = Field(..., description="The affiliate program (e.g., 'Amazon Associates').")
    affiliate_link: HttpUrl = Field(..., description="The unique affiliate tracking link for the product.")

class AffiliateLinkPlacement(BaseModel):
    """
    A recommendation for placing an affiliate link in the content.
    """
    product: AffiliateProduct = Field(..., description="The product to be linked.")
    suggested_anchor_text: str = Field(..., description="The text within the post where the link should be placed.")
    updated_content_snippet: str = Field(..., description="The sentence or paragraph with the affiliate link and FTC disclosure added.")

class AffiliateLinkReport(BaseModel):
    """
    A report of identified affiliate products and placement suggestions for a blog post.
    """
    target_post_url: HttpUrl = Field(..., description="The blog post targeted for link placement.")
    recommended_placements: List[AffiliateLinkPlacement] = Field(..., description="A list of suggested affiliate link placements.")
    compliance_check: str = Field(..., description="Confirmation that FTC disclosure rules have been applied.")