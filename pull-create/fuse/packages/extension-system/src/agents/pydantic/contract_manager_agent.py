from pydantic import BaseModel, Field, HttpUrl

class ContractManagerInput(BaseModel):
    """
    Input required to draft an influencer contract.
    """
    term_sheet: dict = Field(..., description="The finalized term sheet from the DealNegotiatorAgent.")

class InfluencerContract(BaseModel):
    """
    A legally sound influencer contract.
    """
    contract_title: str
    full_legal_text: str = Field(..., description="The full text of the contract, outlining all agreed-upon terms.")
    digital_signature_url: HttpUrl = Field(..., description="A URL for both parties to execute the contract.")