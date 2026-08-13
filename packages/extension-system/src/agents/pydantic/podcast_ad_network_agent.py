from pydantic import BaseModel, Field
from typing import List, Literal

class PodcastAdNetworkInput(BaseModel):
    """
    Input required to connect with podcast ad networks.
    """
    rss_feed_url: str
    download_numbers: int

class AdNetworkIntegration(BaseModel):
    """
    Represents the status of integration with a single ad network.
    """
    network_name: Literal["Acast", "Simplecast AdsWizz", "Other"]
    status: Literal["Application Submitted", "Approved and Integrated", "Rejected"]
    commission_rate: str

class AdNetworkStatusReport(BaseModel):
    """
    A report on the status of integrations with podcast ad networks.
    """
    integrations: List[AdNetworkIntegration]