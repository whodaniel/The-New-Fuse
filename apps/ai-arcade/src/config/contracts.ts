export const contractConfig = {
  network: 'localhost',
  chainId: 31337,
  address: {
    token: '',
    merkaba: '',
    genesis: '',
    engine: '',
  },
  abi: {
    // We will populate this later or load from JSON artifacts
    ERC20: [
      'function approve(address spender, uint256 amount) external returns (bool)',
      'function allowance(address owner, address spender) external view returns (uint256)',
      'function balanceOf(address account) external view returns (uint256)',
    ],
    AuctionEngine: [
      'function insertCoin(uint256 _auctionId) external',
      'function unlockAgent(uint256 _auctionId) external',
      'function auctions(uint256) external view returns (uint256 id, string memory agentId, uint256 currentPrice, uint256 floorPrice, uint256 priceDrop, uint256 bidFee, bool active, address winner, address lastBidder, uint256 endTime)',
    ],
    GenesisNode: [
      'function mintGenesis() external',
      'function getClaimable(uint256 _tokenId) external view returns (uint256)',
    ],
  },
};
