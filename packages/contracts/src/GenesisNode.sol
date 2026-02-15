// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GenesisNode
 * @author AI Arcade Systems
 * @notice The 8 Cornerstones of the Merkaba.
 * @dev IDs 1-4 (SUN) track Volume. IDs 5-8 (EARTH) track Yield.
 */
contract GenesisNode is ERC721, Ownable, ReentrancyGuard {

    // --- Configuration ---
    IERC20 public paymentToken; // The Arcade Token (USDC/ETH)

    // Limits
    uint256 public constant MAX_SUPPLY = 8;
    uint256 public constant SUN_NODES = 4;
    uint256 public constant EARTH_NODES = 4;

    // --- Dividend Tracking ---
    // We track total rewards *ever* deposited per node type
    uint256 public totalSunRewardsPerNode;   // Total Volume Rewards / 4
    uint256 public totalEarthRewardsPerNode; // Total Yield Rewards / 4

    // We track how much each Token ID has already claimed
    mapping(uint256 => uint256) public claimedAmount;

    // --- Events ---
    event DividendsDeposited(string sourceType, uint256 totalAmount);
    event DividendsClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);

    constructor(address _paymentToken) ERC721("Merkaba Genesis Node", "MK-GEN") Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    // --- 1. Minting (The Bootstrap Sale) ---
    /**
     * @notice Mint the 8 Nodes.
     * @dev Initially minted to Admin, then auctioned off via Opensea or custom Dutch Auction.
     */
    function mintGenesis() external onlyOwner {
        // require(totalSupply() == 0, "Already minted"); // totalSupply() isn't standard in base ERC721, using counter logic is better or just loop
         // Using a simple check if ID 1 exists
        require(_ownerOf(1) == address(0), "Already minted");

        for (uint256 i = 1; i <= MAX_SUPPLY; i++) {
            _mint(msg.sender, i);
        }
    }

    // --- 2. The Injection (Money In) ---

    /**
     * @notice Called by AuctionEngine. Adds 1% of Bid Volume to Sun Nodes.
     */
    function depositSunRewards(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero value");
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // Split equally among the 4 Sun Nodes
        uint256 share = _amount / SUN_NODES;
        totalSunRewardsPerNode += share;

        emit DividendsDeposited("SUN_VOLUME", _amount);
    }

    /**
     * @notice Called by MerkabaCore. Adds 1% of Treasury Yield to Earth Nodes.
     */
    function depositEarthRewards(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero value");
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // Split equally among the 4 Earth Nodes
        uint256 share = _amount / EARTH_NODES;
        totalEarthRewardsPerNode += share;

        emit DividendsDeposited("EARTH_YIELD", _amount);
    }

    // --- 3. The Claim (Money Out) ---

    /**
     * @notice Allows NFT holder to pull their accumulated dividends.
     * @dev The dividend stays with the Token ID. If you sell the NFT,
     * the new owner can claim the unclaimed rewards.
     */
    function claimDividends(uint256 _tokenId) external nonReentrant {
        // Updated for newer OpenZeppelin where ownerOf might be different or _ownerOf
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");

        uint256 owed = 0;

        if (_tokenId <= 4) {
            // SUN NODE (1, 2, 3, 4)
            owed = totalSunRewardsPerNode - claimedAmount[_tokenId];
        } else if (_tokenId <= 8) {
            // EARTH NODE (5, 6, 7, 8)
            owed = totalEarthRewardsPerNode - claimedAmount[_tokenId];
        }

        require(owed > 0, "Nothing to claim");

        // Update state BEFORE transfer (Security best practice)
        claimedAmount[_tokenId] += owed;

        // Payout
        require(paymentToken.transfer(msg.sender, owed), "Payout failed");

        emit DividendsClaimed(_tokenId, msg.sender, owed);
    }

    // --- View Functions (For UI) ---

    function getClaimable(uint256 _tokenId) external view returns (uint256) {
        if (_tokenId <= 4) {
             return totalSunRewardsPerNode - claimedAmount[_tokenId];
        } else if (_tokenId <= 8) {
             return totalEarthRewardsPerNode - claimedAmount[_tokenId];
        }
        return 0;
    }
}
