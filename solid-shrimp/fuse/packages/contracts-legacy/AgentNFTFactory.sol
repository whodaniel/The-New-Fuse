// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/interfaces/IERC4907.sol";

/**
 * @title AgentNFTFactory
 * @dev Smart contract for minting and managing Agent NFTs in The New Fuse ecosystem
 * 
 * Features:
 * - ERC-721 base functionality for unique agent representation
 * - Dynamic NFT (dNFT) capabilities for metadata updates
 * - ERC-6551 compatibility for Token Bound Accounts (TBA)
 * - ERC-2981 royalty support for economic sustainability
 * - ERC-4907 rental standard for agent utilization
 * - Access control for secure minting and management
 * 
 * This contract serves as the exclusive minting authority for all Agent NFTs
 * and bridges off-chain agent registration with on-chain identity.
 */
contract AgentNFTFactory is 
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    AccessControl,
    Pausable,
    ReentrancyGuard,
    IERC2981,
    IERC4907
{
    using Counters for Counters.Counter;

    // ============ State Variables ============
    
    Counters.Counter private _tokenIdCounter;
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Agent NFT metadata structure
    struct AgentMetadata {
        string agentId;           // Off-chain agent ID from MasterAgentRegistry
        string legalContractURI;  // IPFS hash of Agent Constitution
        address creator;          // Address that minted the agent
        uint256 createdAt;        // Timestamp of creation
        uint256 lastUpdate;       // Last metadata update timestamp
        bool isActive;            // Agent active status
        string agentType;         // Type of agent (BASIC, WORKFLOW, etc.)
        address tbaAddress;       // Token Bound Account address
    }

    // ERC-4907 rental functionality
    struct UserInfo {
        address user;
        uint64 expires;
    }

    // ============ Mappings ============
    
    mapping(uint256 => AgentMetadata) public agentMetadata;
    mapping(string => uint256) public agentIdToTokenId;  // Off-chain ID to token ID
    mapping(uint256 => UserInfo) private _users;         // Rental users
    mapping(uint256 => address) private _tokenApprovals; // Token approvals

    // Royalty information
    address public royaltyRecipient;
    uint96 public royaltyPercentage; // Basis points (e.g., 250 = 2.5%)

    // ============ Events ============
    
    event AgentMinted(
        uint256 indexed tokenId,
        string indexed agentId,
        address indexed creator,
        address tbaAddress,
        string legalContractURI
    );
    
    event AgentMetadataUpdated(
        uint256 indexed tokenId,
        string indexed agentId,
        string newMetadataURI,
        uint256 timestamp
    );
    
    event AgentStatusChanged(
        uint256 indexed tokenId,
        string indexed agentId,
        bool isActive
    );

    event TBAAddressSet(
        uint256 indexed tokenId,
        address indexed tbaAddress
    );

    event UpdateUserInfo(
        uint256 indexed tokenId,
        address indexed user,
        uint64 expires
    );

    // ============ Constructor ============
    
    constructor(
        string memory name,
        string memory symbol,
        address defaultAdmin,
        address royaltyRecipient_,
        uint96 royaltyPercentage_
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(ORACLE_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);

        royaltyRecipient = royaltyRecipient_;
        royaltyPercentage = royaltyPercentage_;
    }

    // ============ Core Minting Functions ============
    
    /**
     * @dev Mint a new Agent NFT with complete metadata
     * @param owner Address to receive the minted NFT
     * @param agentId Off-chain agent ID from MasterAgentRegistry
     * @param initialMetadata Initial metadata URI (IPFS hash)
     * @param legalContractURI IPFS hash of the Agent Constitution
     * @param agentType Type of agent being minted
     * @return tokenId The newly minted token ID
     */
    function mintAgent(
        address owner,
        string calldata agentId,
        string calldata initialMetadata,
        string calldata legalContractURI,
        string calldata agentType
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256) {
        require(owner != address(0), "AgentNFTFactory: Cannot mint to zero address");
        require(bytes(agentId).length > 0, "AgentNFTFactory: Agent ID cannot be empty");
        require(agentIdToTokenId[agentId] == 0, "AgentNFTFactory: Agent ID already exists");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Store agent metadata
        agentMetadata[tokenId] = AgentMetadata({
            agentId: agentId,
            legalContractURI: legalContractURI,
            creator: msg.sender,
            createdAt: block.timestamp,
            lastUpdate: block.timestamp,
            isActive: true,
            agentType: agentType,
            tbaAddress: address(0) // Will be set after TBA creation
        });

        // Create mapping from off-chain ID to token ID
        agentIdToTokenId[agentId] = tokenId;

        // Mint the NFT
        _safeMint(owner, tokenId);
        _setTokenURI(tokenId, initialMetadata);

        emit AgentMinted(tokenId, agentId, msg.sender, address(0), legalContractURI);

        return tokenId;
    }

    /**
     * @dev Set the Token Bound Account address for an agent
     * @param tokenId The token ID
     * @param tbaAddress The TBA address to associate
     */
    function setTBAAddress(uint256 tokenId, address tbaAddress) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        require(_exists(tokenId), "AgentNFTFactory: Token does not exist");
        require(tbaAddress != address(0), "AgentNFTFactory: Invalid TBA address");

        agentMetadata[tokenId].tbaAddress = tbaAddress;
        emit TBAAddressSet(tokenId, tbaAddress);
    }

    // ============ Dynamic NFT Functions ============
    
    /**
     * @dev Update metadata for a specific token (dNFT functionality)
     * @param tokenId The token ID to update
     * @param newMetadataURI New metadata URI
     */
    function updateMetadata(uint256 tokenId, string calldata newMetadataURI) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        require(_exists(tokenId), "AgentNFTFactory: Token does not exist");
        
        _setTokenURI(tokenId, newMetadataURI);
        agentMetadata[tokenId].lastUpdate = block.timestamp;
        
        emit AgentMetadataUpdated(
            tokenId, 
            agentMetadata[tokenId].agentId, 
            newMetadataURI, 
            block.timestamp
        );
    }

    /**
     * @dev Update agent active status
     * @param tokenId The token ID
     * @param isActive New active status
     */
    function updateAgentStatus(uint256 tokenId, bool isActive) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        require(_exists(tokenId), "AgentNFTFactory: Token does not exist");
        
        agentMetadata[tokenId].isActive = isActive;
        agentMetadata[tokenId].lastUpdate = block.timestamp;
        
        emit AgentStatusChanged(tokenId, agentMetadata[tokenId].agentId, isActive);
    }

    // ============ ERC-4907 Rental Functions ============
    
    /**
     * @dev Set the user and expires of an NFT
     * @param tokenId The NFT to set the user for
     * @param user The new user of the NFT
     * @param expires UNIX timestamp when the user expires
     */
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "AgentNFTFactory: transfer caller is not owner nor approved");
        UserInfo storage info = _users[tokenId];
        info.user = user;
        info.expires = expires;
        emit UpdateUserInfo(tokenId, user, expires);
    }

    /**
     * @dev Get the user address of an NFT
     * @param tokenId The NFT to get the user address for
     * @return The user address for this NFT
     */
    function userOf(uint256 tokenId) public view virtual override returns(address) {
        if (uint256(_users[tokenId].expires) >= block.timestamp) {
            return _users[tokenId].user;
        } else {
            return address(0);
        }
    }

    /**
     * @dev Get the user expires of an NFT
     * @param tokenId The NFT to get the user expires for
     * @return The user expires for this NFT
     */
    function userExpires(uint256 tokenId) public view virtual override returns(uint256) {
        return _users[tokenId].expires;
    }

    // ============ ERC-2981 Royalty Functions ============
    
    /**
     * @dev Return royalty information for a token
     * @param tokenId The token ID
     * @param salePrice The sale price of the token
     * @return receiver The royalty recipient
     * @return royaltyAmount The royalty amount
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(tokenId), "AgentNFTFactory: Token does not exist");
        
        receiver = royaltyRecipient;
        royaltyAmount = (salePrice * royaltyPercentage) / 10000;
    }

    /**
     * @dev Update royalty information
     * @param recipient New royalty recipient
     * @param percentage New royalty percentage in basis points
     */
    function setRoyaltyInfo(address recipient, uint96 percentage) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(recipient != address(0), "AgentNFTFactory: Invalid recipient");
        require(percentage <= 1000, "AgentNFTFactory: Royalty too high"); // Max 10%
        
        royaltyRecipient = recipient;
        royaltyPercentage = percentage;
    }

    // ============ View Functions ============
    
    /**
     * @dev Get complete agent metadata
     * @param tokenId The token ID
     * @return metadata The agent metadata struct
     */
    function getAgentMetadata(uint256 tokenId) 
        external 
        view 
        returns (AgentMetadata memory metadata) 
    {
        require(_exists(tokenId), "AgentNFTFactory: Token does not exist");
        return agentMetadata[tokenId];
    }

    /**
     * @dev Get token ID by agent ID
     * @param agentId The off-chain agent ID
     * @return tokenId The associated token ID (0 if not found)
     */
    function getTokenIdByAgentId(string calldata agentId) 
        external 
        view 
        returns (uint256 tokenId) 
    {
        return agentIdToTokenId[agentId];
    }

    /**
     * @dev Get the current token ID counter
     * @return The current token count
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Check if an agent is active
     * @param tokenId The token ID
     * @return True if agent is active
     */
    function isAgentActive(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "AgentNFTFactory: Token does not exist");
        return agentMetadata[tokenId].isActive;
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Pause the contract
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ Override Functions ============
    
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Clear rental info on transfer
        if (from != address(0) && to != address(0)) {
            delete _users[tokenId];
            emit UpdateUserInfo(tokenId, address(0), 0);
        }
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up metadata
        string memory agentId = agentMetadata[tokenId].agentId;
        delete agentMetadata[tokenId];
        delete agentIdToTokenId[agentId];
        delete _users[tokenId];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl, IERC165)
        returns (bool)
    {
        return 
            interfaceId == type(IERC2981).interfaceId ||
            interfaceId == type(IERC4907).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}