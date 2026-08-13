from tnf_contracts.crypto_operations import (
    EnsoDefiInput,
    EnsoExecutionResult,
    AkashDeploymentInput,
    ArweaveStorageInput,
    RenderJobInput,
    RenderJobResult,
    EnsoMetadata,
    AkashMetadata,
    ArweaveMetadata,
    RenderMetadata,
    TokenAmount,
    RouteStep,
    TransactionResult,
    RenderAsset,
    CryptoOperationsBundle
)

def main():
    print("Successfully imported crypto operations models.")
    
    # Try to instantiate one
    amount = TokenAmount(
        token_symbol="ETH",
        token_address="0x0",
        amount="1.0",
        decimals=18
    )
    print(f"Instantiated TokenAmount: {amount}")

if __name__ == "__main__":
    main()
