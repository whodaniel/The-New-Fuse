from pydantic import BaseModel, Field, HttpUrl
from typing import List

class TechnicalSetupInput(BaseModel):
    """
    Input required to perform the technical setup of the blog.
    """
    blog_name: str = Field(..., description="The selected name for the blog.")
    domain_name: str = Field(..., description="The exact domain name to be registered (e.g., 'example.com').")
    hosting_provider: str = Field(default="Bluehost", description="The chosen web hosting provider.")

class PluginConfiguration(BaseModel):
    """
    Represents an essential plugin to be installed and configured.
    """
    name: str = Field(..., description="The name of the plugin (e.g., 'Yoast SEO').")
    purpose: str = Field(..., description="The function of the plugin (e.g., 'SEO', 'Security', 'Performance').")
    status: str = Field(default="Installed and Configured", description="The installation status.")

class TechnicalSetupReceipt(BaseModel):
    """
    The final output confirming the successful technical setup of the blog.
    """
    website_url: HttpUrl = Field(..., description="The URL of the newly deployed blog.")
    wordpress_admin_url: HttpUrl = Field(..., description="The URL for the WordPress admin login page.")
    hosting_provider_details: str = Field(..., description="Confirmation of the hosting plan purchase.")
    domain_registration_details: str = Field(..., description="Confirmation of the domain name registration.")
    wordpress_theme: str = Field(..., description="The name of the installed and activated mobile-responsive theme.")
    configured_plugins: List[PluginConfiguration] = Field(..., description="A list of essential plugins that have been configured.")
    permalink_structure: str = Field(..., description="Confirmation of the SEO-friendly permalink structure (e.g., 'Post name').")