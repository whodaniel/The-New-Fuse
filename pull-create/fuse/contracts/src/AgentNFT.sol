// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TNFSmartAccountFactory.sol";

/**
 * @title AgentNFT
 * @dev NFT contract where each Agent is an NFT with its own Smart Account wallet
 * Supports fractional ownership, revenue distribution, and asset management
 */
contract AgentNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    TNFSmartAccountFactory public immutable smartAccountFactory;

    struct AgentMetadata {
        string name;
        string description;
        string agentType;
        string capabilities;
        address smartAccountAddress;
        bool isActive;
        uint256 createdAt;
        uint256 totalRevenue;
        mapping(address => uint256) tokenBalances; // Track owned tokens
    }

    struct FractionalShare {
        address owner;
        uint256 percentage; // Basis points (10000 = 100%)
        uint256 purchasePrice;
        uint256 purchaseDate;
    }

    // Agent ID to metadata
    mapping(uint256 => AgentMetadata) public agentMetadata;
    
    // Agent ID to fractional ownership shares
    mapping(uint256 => FractionalShare[]) public fractionalShares;
    
    // Agent ID to total fractional shares sold (basis points)
    mapping(uint256 => uint256) public totalFractionalShares;
    
    // Agent ID to revenue distribution queue
    mapping(uint256 => uint256) public pendingRevenue;
    
    // Agent ID to authorized operators (can manage agent on behalf of owner)
    mapping(uint256 => mapping(address => bool)) public agentOperators;

    // Events
    event AgentMinted(uint256 indexed tokenId, address indexed owner, address smartAccount);
    event AgentActivated(uint256 indexed tokenId);
    event AgentDeactivated(uint256 indexed tokenId);
    event FractionalShareSold(uint256 indexed tokenId, address indexed buyer, uint256 percentage, uint256 price);
    event RevenueDistributed(uint256 indexed tokenId, uint256 totalAmount);
    event AgentOperatorSet(uint256 indexed tokenId, address indexed operator, bool authorized);
    event AssetReceived(uint256 indexed tokenId, address indexed token, uint256 amount);

    modifier onlyAgentOwnerOrOperator(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || agentOperators[tokenId][msg.sender],
            "Not authorized to manage this agent"
        );
        _;
    }

    modifier agentExists(uint256 tokenId) {
        require(_exists(tokenId), "Agent does not exist");
        _;
    }

    constructor(
        address _smartAccountFactory
    ) ERC721("The New Fuse Agent NFT", "TNFA") Ownable(msg.sender) {
        smartAccountFactory = TNFSmartAccountFactory(_smartAccountFactory);
    }

    /**
     * @dev Mint a new Agent NFT with associated Smart Account
     */
    function mintAgent(
        address to,
        string memory name,
        string memory description,
        string memory agentType,
        string memory capabilities,
        string memory tokenURI
    ) external onlyOwner returns (uint256 tokenId, address smartAccount) {
        tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Create Smart Account for the agent
        bytes32 salt = keccak256(abi.encodePacked("agent", tokenId, block.timestamp));
        smartAccount = address(smartAccountFactory.createAccount(address(this), salt));

        // Initialize agent metadata
        AgentMetadata storage metadata = agentMetadata[tokenId];
        metadata.name = name;
        metadata.description = description;
        metadata.agentType = agentType;
        metadata.capabilities = capabilities;
        metadata.smartAccountAddress = smartAccount;
        metadata.isActive = true;
        metadata.createdAt = block.timestamp;
        metadata.totalRevenue = 0;

        emit AgentMinted(tokenId, to, smartAccount);
        emit AgentActivated(tokenId);

        return (tokenId, smartAccount);
    }

    /**
     * @dev Sell fractional ownership of an Agent NFT
     */
    function sellFractionalShare(
        uint256 tokenId,
        address buyer,
        uint256 percentage,
        uint256 price
    ) external onlyAgentOwnerOrOperator(tokenId) agentExists(tokenId) nonReentrant {
        require(percentage > 0 && percentage <= 10000, "Invalid percentage");
        require(totalFractionalShares[tokenId] + percentage <= 10000, "Exceeds 100% ownership");
        require(buyer != address(0), "Invalid buyer address");

        // Transfer payment to current owner
        require(msg.value >= price, "Insufficient payment");
        
        // Add fractional share
        fractionalShares[tokenId].push(FractionalShare({
            owner: buyer,
            percentage: percentage,
            purchasePrice: price,
            purchaseDate: block.timestamp
        }));

        totalFractionalShares[tokenId] += percentage;

        // Transfer payment to agent owner
        payable(ownerOf(tokenId)).transfer(price);
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit FractionalShareSold(tokenId, buyer, percentage, price);
    }

    /**
     * @dev Distribute revenue to fractional owners and NFT owner
     */
    function distributeRevenue(uint256 tokenId) external agentExists(tokenId) nonReentrant {
        uint256 totalRevenue = pendingRevenue[tokenId];
        require(totalRevenue > 0, "No pending revenue");

        // Calculate distributions
        uint256 distributedAmount = 0;
        FractionalShare[] storage shares = fractionalShares[tokenId];

        // Distribute to fractional owners
        for (uint256 i = 0; i < shares.length; i++) {
            uint256 shareAmount = (totalRevenue * shares[i].percentage) / 10000;
            if (shareAmount > 0) {
                payable(shares[i].owner).transfer(shareAmount);
                distributedAmount += shareAmount;
            }
        }

        // Remaining amount goes to NFT owner
        uint256 ownerAmount = totalRevenue - distributedAmount;
        if (ownerAmount > 0) {
            payable(ownerOf(tokenId)).transfer(ownerAmount);
        }

        // Update metadata
        agentMetadata[tokenId].totalRevenue += totalRevenue;
        pendingRevenue[tokenId] = 0;

        emit RevenueDistributed(tokenId, totalRevenue);
    }

    /**
     * @dev Add revenue for an agent (to be distributed)
     */
    function addRevenue(uint256 tokenId) external payable agentExists(tokenId) {
        require(msg.value > 0, "No revenue to add");
        pendingRevenue[tokenId] += msg.value;
    }

    /**
     * @dev Set operator authorization for an agent
     */
    function setAgentOperator(
        uint256 tokenId,
        address operator,
        bool authorized
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Only agent owner can set operators");
        agentOperators[tokenId][operator] = authorized;
        emit AgentOperatorSet(tokenId, operator, authorized);
    }

    /**
     * @dev Toggle agent active status
     */
    function setAgentActive(uint256 tokenId, bool active) external onlyAgentOwnerOrOperator(tokenId) agentExists(tokenId) {
        agentMetadata[tokenId].isActive = active;
        if (active) {
            emit AgentActivated(tokenId);
        } else {
            emit AgentDeactivated(tokenId);
        }
    }

    /**
     * @dev Transfer tokens from agent's Smart Account to specified address
     */
    function transferAgentAsset(
        uint256 tokenId,
        address token,
        address to,
        uint256 amount
    ) external onlyAgentOwnerOrOperator(tokenId) agentExists(tokenId) {
        address agentSmartAccount = agentMetadata[tokenId].smartAccountAddress;
        
        if (token == address(0)) {
            // Transfer ETH
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer ERC20 token
            IERC20(token).transferFrom(agentSmartAccount, to, amount);
        }
    }

    /**
     * @dev Get agent information
     */
    function getAgentInfo(uint256 tokenId) external view agentExists(tokenId) returns (
        string memory name,
        string memory description,
        string memory agentType,
        string memory capabilities,
        address smartAccountAddress,
        bool isActive,
        uint256 createdAt,
        uint256 totalRevenue,
        uint256 pendingRevenueAmount,
        uint256 fractionalSharesCount
    ) {
        AgentMetadata storage metadata = agentMetadata[tokenId];
        return (
            metadata.name,
            metadata.description,
            metadata.agentType,
            metadata.capabilities,
            metadata.smartAccountAddress,
            metadata.isActive,
            metadata.createdAt,
            metadata.totalRevenue,
            pendingRevenue[tokenId],
            fractionalShares[tokenId].length
        );
    }

    /**
     * @dev Get fractional shares for an agent
     */
    function getFractionalShares(uint256 tokenId) external view agentExists(tokenId) returns (FractionalShare[] memory) {
        return fractionalShares[tokenId];
    }

    /**
     * @dev Get total fractional ownership percentage sold
     */
    function getTotalFractionalShares(uint256 tokenId) external view agentExists(tokenId) returns (uint256) {
        return totalFractionalShares[tokenId];
    }

    /**
     * @dev Calculate ownership percentage for an address
     */
    function getOwnershipPercentage(uint256 tokenId, address owner) external view agentExists(tokenId) returns (uint256) {
        // Check if owner owns the NFT (remaining percentage after fractional sales)
        if (ownerOf(tokenId) == owner) {
            return 10000 - totalFractionalShares[tokenId];
        }

        // Check fractional ownership
        uint256 totalOwnership = 0;
        FractionalShare[] storage shares = fractionalShares[tokenId];
        for (uint256 i = 0; i < shares.length; i++) {
            if (shares[i].owner == owner) {
                totalOwnership += shares[i].percentage;
            }
        }
        return totalOwnership;
    }

    /**
     * @dev Transfer fractional share ownership (for marketplace)
     */
    function transferFractionalShare(
        uint256 tokenId,
        uint256 shareIndex,
        address from,
        address to
    ) external agentExists(tokenId) {
        require(to != address(0), "Invalid recipient address");
        require(shareIndex < fractionalShares[tokenId].length, "Invalid share index");
        
        FractionalShare storage share = fractionalShares[tokenId][shareIndex];
        require(share.owner == from, "Not the share owner");
        
        // Only allow authorized contracts (marketplace) to transfer shares
        require(
            msg.sender == owner() || // Contract owner
            agentOperators[tokenId][msg.sender] || // Authorized operator
            ownerOf(tokenId) == msg.sender, // NFT owner
            "Not authorized to transfer shares"
        );
        
        share.owner = to;
        
        emit FractionalShareTransferred(tokenId, shareIndex, from, to, share.percentage);
    }

    /**
     * @dev Authorize marketplace contract to transfer fractional shares
     */
    function setMarketplaceApproval(address marketplace, bool approved) external onlyOwner {
        // This would set approval for marketplace contract to transfer shares
        // Implementation depends on how you want to manage marketplace permissions
    }

    // Override functions for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Receive function to handle direct ETH transfers as revenue
     */
    receive() external payable {
        // This allows the contract to receive ETH directly
        // Can be used for general revenue distribution
    }
}