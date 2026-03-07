// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FractionalizationVault
 * @dev Enables fractional ownership of Agent NFTs through ERC-20 share tokens
 * 
 * Features:
 * - Lock Agent NFTs to mint fractional shares
 * - Proportional revenue distribution to shareholders
 * - Governance rights for share holders
 * - Redeem mechanism for reconstructing full ownership
 * 
 * This contract enables economic participation in high-value agent operations
 * by allowing multiple parties to own shares of a single agent.
 */
contract FractionalizationVault is ERC20, IERC721Receiver, ReentrancyGuard, AccessControl, Pausable {
    
    // ============ State Variables ============
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    
    struct FractionalizedNFT {
        address nftContract;        // Agent NFT contract address
        uint256 tokenId;           // Agent NFT token ID
        uint256 totalShares;       // Total shares minted
        uint256 sharePrice;        // Price per share in wei
        bool isActive;             // Whether shares are active
        uint256 totalRevenue;      // Total revenue collected
        uint256 lastRevenueDistribution; // Last distribution timestamp
        address originalOwner;     // Original NFT owner
        mapping(address => uint256) lastClaimedRevenue; // Per-shareholder tracking
    }
    
    // ============ Mappings & Storage ============
    
    mapping(uint256 => FractionalizedNFT) public fractionalizedNFTs;
    mapping(address => mapping(uint256 => uint256)) public shareholderBalances;
    
    uint256 public nextVaultId;
    uint256 public constant TOTAL_SHARES = 10000; // 10,000 shares per NFT (0.01% precision)
    uint256 public constant MIN_REDEMPTION_THRESHOLD = 8000; // 80% needed for redemption
    
    // ============ Events ============
    
    event NFTLocked(
        uint256 indexed vaultId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address owner,
        uint256 totalShares,
        uint256 sharePrice
    );
    
    event SharesMinted(
        uint256 indexed vaultId,
        address indexed recipient,
        uint256 shares,
        uint256 payment
    );
    
    event RevenueDeposited(
        uint256 indexed vaultId,
        uint256 amount,
        address indexed depositor
    );
    
    event RevenueDistributed(
        uint256 indexed vaultId,
        address indexed shareholder,
        uint256 amount
    );
    
    event NFTRedeemed(
        uint256 indexed vaultId,
        address indexed redeemer,
        uint256 sharesUsed
    );
    
    // ============ Constructor ============
    
    constructor(
        string memory name,
        string memory symbol,
        address defaultAdmin
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ORACLE_ROLE, defaultAdmin);
        _grantRole(MANAGER_ROLE, defaultAdmin);
        nextVaultId = 1;
    }
    
    // ============ Core Fractionalization Functions ============
    
    /**
     * @dev Lock an Agent NFT and mint fractional shares
     * @param nftContract Address of the Agent NFT contract
     * @param tokenId Token ID of the Agent NFT
     * @param sharePrice Price per share in wei
     * @return vaultId The ID of the created vault
     */
    function lockNFT(
        address nftContract,
        uint256 tokenId,
        uint256 sharePrice
    ) external whenNotPaused nonReentrant returns (uint256 vaultId) {
        require(nftContract != address(0), "FractionalizationVault: Invalid NFT contract");
        require(sharePrice > 0, "FractionalizationVault: Share price must be positive");
        
        // Transfer NFT to this contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        vaultId = nextVaultId++;
        FractionalizedNFT storage vault = fractionalizedNFTs[vaultId];
        
        vault.nftContract = nftContract;
        vault.tokenId = tokenId;
        vault.totalShares = TOTAL_SHARES;
        vault.sharePrice = sharePrice;
        vault.isActive = true;
        vault.totalRevenue = 0;
        vault.lastRevenueDistribution = block.timestamp;
        vault.originalOwner = msg.sender;
        
        // Mint initial shares to the original owner
        _mint(msg.sender, TOTAL_SHARES);
        shareholderBalances[msg.sender][vaultId] = TOTAL_SHARES;
        
        emit NFTLocked(vaultId, nftContract, tokenId, msg.sender, TOTAL_SHARES, sharePrice);
        
        return vaultId;
    }
    
    /**
     * @dev Purchase shares of a fractionalized NFT
     * @param vaultId The vault ID to purchase shares from
     * @param shares Number of shares to purchase
     */
    function buyShares(uint256 vaultId, uint256 shares) external payable whenNotPaused nonReentrant {
        FractionalizedNFT storage vault = fractionalizedNFTs[vaultId];
        require(vault.isActive, "FractionalizationVault: Vault not active");
        require(shares > 0, "FractionalizationVault: Must buy at least 1 share");
        
        uint256 totalCost = shares * vault.sharePrice;
        require(msg.value >= totalCost, "FractionalizationVault: Insufficient payment");
        
        // Find a seller (for simplicity, buy from the contract's balance)
        require(balanceOf(address(this)) >= shares, "FractionalizationVault: Insufficient shares available");
        
        // Transfer shares
        _transfer(address(this), msg.sender, shares);
        shareholderBalances[msg.sender][vaultId] += shares;
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit SharesMinted(vaultId, msg.sender, shares, totalCost);
    }
    
    // ============ Revenue Distribution Functions ============
    
    /**
     * @dev Deposit revenue for a specific vault
     * @param vaultId The vault to deposit revenue for
     */
    function depositRevenue(uint256 vaultId) external payable {
        require(msg.value > 0, "FractionalizationVault: Must send ETH");
        
        FractionalizedNFT storage vault = fractionalizedNFTs[vaultId];
        require(vault.isActive, "FractionalizationVault: Vault not active");
        
        vault.totalRevenue += msg.value;
        
        emit RevenueDeposited(vaultId, msg.value, msg.sender);
    }
    
    /**
     * @dev Claim proportional revenue for multiple shareholders
     * @param vaultId The vault to distribute revenue from
     * @param shareholders Array of shareholder addresses
     */
    function claimRevenue(uint256 vaultId, address[] calldata shareholders) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        FractionalizedNFT storage vault = fractionalizedNFTs[vaultId];
        require(vault.isActive, "FractionalizationVault: Vault not active");
        require(vault.totalRevenue > 0, "FractionalizationVault: No revenue to distribute");
        
        for (uint256 i = 0; i < shareholders.length; i++) {
            address shareholder = shareholders[i];
            uint256 shares = shareholderBalances[shareholder][vaultId];
            
            if (shares > 0) {
                uint256 lastClaimed = vault.lastClaimedRevenue[shareholder];
                uint256 newRevenue = vault.totalRevenue - lastClaimed;
                
                if (newRevenue > 0) {
                    uint256 sharePercentage = (shares * 1e18) / vault.totalShares;
                    uint256 revenueShare = (newRevenue * sharePercentage) / 1e18;
                    
                    if (revenueShare > 0) {
                        vault.lastClaimedRevenue[shareholder] = vault.totalRevenue;
                        payable(shareholder).transfer(revenueShare);
                        
                        emit RevenueDistributed(vaultId, shareholder, revenueShare);
                    }
                }
            }
        }
    }
    
    /**
     * @dev Get claimable revenue for a specific shareholder
     * @param vaultId The vault ID
     * @param shareholder The shareholder address
     * @return claimable The amount of ETH claimable
     */
    function getClaimableRevenue(uint256 vaultId, address shareholder) 
        external 
        view 
        returns (uint256 claimable) 
    {
        FractionalizedNFT storage vault = fractionalizedNFTs[vaultId];
        uint256 shares = shareholderBalances[shareholder][vaultId];
        
        if (shares == 0 || vault.totalRevenue == 0) {
            return 0;
        }
        
        uint256 lastClaimed = vault.lastClaimedRevenue[shareholder];
        uint256 newRevenue = vault.totalRevenue - lastClaimed;
        
        if (newRevenue == 0) {
            return 0;
        }
        
        uint256 sharePercentage = (shares * 1e18) / vault.totalShares;
        claimable = (newRevenue * sharePercentage) / 1e18;
    }
    
    // ============ Redemption Functions ============
    
    /**
     * @dev Redeem shares to unlock the original NFT
     * @param vaultId The vault to redeem from
     * @param shares Number of shares to use for redemption
     */
    function redeemNFT(uint256 vaultId, uint256 shares) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        FractionalizedNFT storage vault = fractionalizedNFTs[vaultId];
        require(vault.isActive, "FractionalizationVault: Vault not active");
        require(shares >= MIN_REDEMPTION_THRESHOLD, "FractionalizationVault: Insufficient shares for redemption");
        require(balanceOf(msg.sender) >= shares, "FractionalizationVault: Insufficient share balance");
        
        // Burn the shares
        _burn(msg.sender, shares);
        shareholderBalances[msg.sender][vaultId] -= shares;
        
        // Mark vault as inactive
        vault.isActive = false;
        
        // Transfer NFT to redeemer
        IERC721(vault.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            vault.tokenId
        );
        
        emit NFTRedeemed(vaultId, msg.sender, shares);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get vault information
     * @param vaultId The vault ID
     * @return nftContract NFT contract address
     * @return tokenId NFT token ID
     * @return totalShares Total shares in vault
     * @return sharePrice Price per share
     * @return isActive Whether vault is active
     * @return totalRevenue Total revenue collected
     */
    function getVaultInfo(uint256 vaultId) 
        external 
        view 
        returns (
            address nftContract,
            uint256 tokenId,
            uint256 totalShares,
            uint256 sharePrice,
            bool isActive,
            uint256 totalRevenue
        )
    {
        FractionalizedNFT storage vault = fractionalizedNFTs[vaultId];
        return (
            vault.nftContract,
            vault.tokenId,
            vault.totalShares,
            vault.sharePrice,
            vault.isActive,
            vault.totalRevenue
        );
    }
    
    /**
     * @dev Get shareholder information for a vault
     * @param vaultId The vault ID
     * @param shareholder The shareholder address
     * @return shares Number of shares owned
     * @return lastClaimed Last claimed revenue amount
     */
    function getShareholderInfo(uint256 vaultId, address shareholder)
        external
        view
        returns (uint256 shares, uint256 lastClaimed)
    {
        shares = shareholderBalances[shareholder][vaultId];
        lastClaimed = fractionalizedNFTs[vaultId].lastClaimedRevenue[shareholder];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Emergency pause functionality
     */
    function pause() external onlyRole(MANAGER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(MANAGER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Handle NFT transfers to this contract
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
    
    // ============ Override Functions ============
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC20, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}