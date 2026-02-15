// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title RoyaltySplitter
 * @dev Handles multi-generational royalty distribution for Agent NFTs
 * 
 * Features:
 * - Automatic royalty splitting across agent lineage hierarchy
 * - Configurable distribution percentages per generation
 * - Support for up to 5 generations in lineage
 * - Gas-efficient batch processing
 * - Emergency withdrawal mechanisms
 * 
 * This contract enables fair compensation for all agents in a derivation chain,
 * incentivizing collaboration and knowledge sharing in the agent ecosystem.
 */
contract RoyaltySplitter is ReentrancyGuard, AccessControl, Pausable {
    
    // ============ State Variables ============
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    
    struct RoyaltyRecipient {
        address recipient;          // Address to receive royalties
        uint256 percentage;         // Percentage in basis points (100 = 1%)
        uint256 generation;         // Generation level (0 = creator, 1 = child, etc.)
        bool isActive;              // Whether recipient is active
    }
    
    struct RoyaltyDistribution {
        uint256 totalAmount;        // Total amount to distribute
        uint256 distributed;        // Amount already distributed
        uint256 timestamp;          // When distribution was created
        bool isCompleted;           // Whether distribution is complete
        mapping(address => uint256) recipientAmounts; // Amount per recipient
        address[] recipients;       // Array of recipient addresses
    }
    
    // ============ Mappings & Storage ============
    
    mapping(uint256 => RoyaltyRecipient[]) public agentRoyalties; // tokenId => recipients
    mapping(uint256 => RoyaltyDistribution) public distributions; // distributionId => distribution
    mapping(address => uint256) public pendingWithdrawals; // address => amount
    
    uint256 public nextDistributionId;
    uint256 public constant MAX_GENERATIONS = 5;
    uint256 public constant MAX_TOTAL_PERCENTAGE = 10000; // 100% in basis points
    
    // Default distribution percentages by generation (basis points)
    uint256[MAX_GENERATIONS] public defaultPercentages = [
        5000,  // 50% - Creator (generation 0)
        2500,  // 25% - First parent (generation 1)
        1250,  // 12.5% - Second parent (generation 2)
        625,   // 6.25% - Third parent (generation 3)
        625    // 6.25% - Fourth parent (generation 4)
    ];
    
    address public agentNFTContract; // Address of AgentNFTFactory
    
    // ============ Events ============
    
    event RoyaltyRecipientsSet(
        uint256 indexed tokenId,
        address[] recipients,
        uint256[] percentages,
        uint256[] generations
    );
    
    event RoyaltyDistributionCreated(
        uint256 indexed distributionId,
        uint256 indexed tokenId,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event RoyaltyDistributed(
        uint256 indexed distributionId,
        address indexed recipient,
        uint256 amount
    );
    
    event WithdrawalProcessed(
        address indexed recipient,
        uint256 amount
    );
    
    event DefaultPercentagesUpdated(
        uint256[MAX_GENERATIONS] newPercentages
    );
    
    // ============ Constructor ============
    
    constructor(
        address defaultAdmin,
        address _agentNFTContract
    ) {
        require(_agentNFTContract != address(0), "RoyaltySplitter: Invalid NFT contract");
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ORACLE_ROLE, defaultAdmin);
        _grantRole(MANAGER_ROLE, defaultAdmin);
        
        agentNFTContract = _agentNFTContract;
        nextDistributionId = 1;
    }
    
    // ============ Core Royalty Functions ============
    
    /**
     * @dev Set royalty recipients for an agent NFT
     * @param tokenId The agent NFT token ID
     * @param recipients Array of recipient addresses
     * @param percentages Array of percentages in basis points
     * @param generations Array of generation levels
     */
    function setRoyaltyRecipients(
        uint256 tokenId,
        address[] calldata recipients,
        uint256[] calldata percentages,
        uint256[] calldata generations
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(recipients.length == percentages.length, "RoyaltySplitter: Array length mismatch");
        require(recipients.length == generations.length, "RoyaltySplitter: Array length mismatch");
        require(recipients.length <= MAX_GENERATIONS, "RoyaltySplitter: Too many recipients");
        
        // Verify NFT exists
        require(_tokenExists(tokenId), "RoyaltySplitter: Token does not exist");
        
        // Clear existing recipients
        delete agentRoyalties[tokenId];
        
        uint256 totalPercentage = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "RoyaltySplitter: Invalid recipient");
            require(percentages[i] > 0, "RoyaltySplitter: Invalid percentage");
            require(generations[i] < MAX_GENERATIONS, "RoyaltySplitter: Invalid generation");
            
            totalPercentage += percentages[i];
            
            agentRoyalties[tokenId].push(RoyaltyRecipient({
                recipient: recipients[i],
                percentage: percentages[i],
                generation: generations[i],
                isActive: true
            }));
        }
        
        require(totalPercentage <= MAX_TOTAL_PERCENTAGE, "RoyaltySplitter: Total percentage exceeds 100%");
        
        emit RoyaltyRecipientsSet(tokenId, recipients, percentages, generations);
    }
    
    /**
     * @dev Set default royalty recipients using standard percentages
     * @param tokenId The agent NFT token ID
     * @param lineage Array of addresses in lineage order (creator first)
     */
    function setDefaultRoyaltyRecipients(
        uint256 tokenId,
        address[] calldata lineage
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(lineage.length > 0, "RoyaltySplitter: Empty lineage");
        require(lineage.length <= MAX_GENERATIONS, "RoyaltySplitter: Lineage too long");
        require(_tokenExists(tokenId), "RoyaltySplitter: Token does not exist");
        
        // Clear existing recipients
        delete agentRoyalties[tokenId];
        
        for (uint256 i = 0; i < lineage.length; i++) {
            require(lineage[i] != address(0), "RoyaltySplitter: Invalid lineage address");
            
            agentRoyalties[tokenId].push(RoyaltyRecipient({
                recipient: lineage[i],
                percentage: defaultPercentages[i],
                generation: i,
                isActive: true
            }));
        }
        
        // Extract arrays for event emission
        address[] memory recipients = new address[](lineage.length);
        uint256[] memory percentages = new uint256[](lineage.length);
        uint256[] memory generations = new uint256[](lineage.length);
        
        for (uint256 i = 0; i < lineage.length; i++) {
            recipients[i] = lineage[i];
            percentages[i] = defaultPercentages[i];
            generations[i] = i;
        }
        
        emit RoyaltyRecipientsSet(tokenId, recipients, percentages, generations);
    }
    
    /**
     * @dev Create a royalty distribution for an agent
     * @param tokenId The agent NFT token ID
     * @return distributionId The ID of the created distribution
     */
    function createRoyaltyDistribution(uint256 tokenId) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        returns (uint256 distributionId) 
    {
        require(msg.value > 0, "RoyaltySplitter: Must send ETH");
        require(_tokenExists(tokenId), "RoyaltySplitter: Token does not exist");
        
        RoyaltyRecipient[] storage recipients = agentRoyalties[tokenId];
        require(recipients.length > 0, "RoyaltySplitter: No royalty recipients set");
        
        distributionId = nextDistributionId++;
        RoyaltyDistribution storage distribution = distributions[distributionId];
        
        distribution.totalAmount = msg.value;
        distribution.distributed = 0;
        distribution.timestamp = block.timestamp;
        distribution.isCompleted = false;
        
        // Calculate amounts for each recipient
        uint256 totalDistributed = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i].isActive) {
                uint256 amount = (msg.value * recipients[i].percentage) / MAX_TOTAL_PERCENTAGE;
                
                if (amount > 0) {
                    distribution.recipientAmounts[recipients[i].recipient] = amount;
                    distribution.recipients.push(recipients[i].recipient);
                    totalDistributed += amount;
                }
            }
        }
        
        distribution.distributed = totalDistributed;
        
        emit RoyaltyDistributionCreated(distributionId, tokenId, msg.value, distribution.recipients.length);
        
        return distributionId;
    }
    
    /**
     * @dev Execute a royalty distribution
     * @param distributionId The distribution ID to execute
     */
    function executeDistribution(uint256 distributionId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        RoyaltyDistribution storage distribution = distributions[distributionId];
        require(!distribution.isCompleted, "RoyaltySplitter: Distribution already completed");
        require(distribution.totalAmount > 0, "RoyaltySplitter: Invalid distribution");
        
        for (uint256 i = 0; i < distribution.recipients.length; i++) {
            address recipient = distribution.recipients[i];
            uint256 amount = distribution.recipientAmounts[recipient];
            
            if (amount > 0) {
                pendingWithdrawals[recipient] += amount;
                distribution.recipientAmounts[recipient] = 0;
                
                emit RoyaltyDistributed(distributionId, recipient, amount);
            }
        }
        
        distribution.isCompleted = true;
    }
    
    /**
     * @dev Withdraw pending royalties
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "RoyaltySplitter: No pending withdrawals");
        
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit WithdrawalProcessed(msg.sender, amount);
    }
    
    /**
     * @dev Batch withdraw for multiple recipients (gas optimization)
     * @param recipients Array of recipient addresses
     */
    function batchWithdraw(address[] calldata recipients) 
        external 
        onlyRole(MANAGER_ROLE) 
        nonReentrant 
    {
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = pendingWithdrawals[recipient];
            
            if (amount > 0) {
                pendingWithdrawals[recipient] = 0;
                payable(recipient).transfer(amount);
                
                emit WithdrawalProcessed(recipient, amount);
            }
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get royalty recipients for an agent
     * @param tokenId The agent NFT token ID
     * @return recipients Array of recipient data
     */
    function getRoyaltyRecipients(uint256 tokenId) 
        external 
        view 
        returns (RoyaltyRecipient[] memory recipients) 
    {
        return agentRoyalties[tokenId];
    }
    
    /**
     * @dev Get distribution information
     * @param distributionId The distribution ID
     * @return totalAmount Total amount in distribution
     * @return distributed Amount distributed
     * @return timestamp When distribution was created
     * @return isCompleted Whether distribution is complete
     * @return recipients Array of recipient addresses
     */
    function getDistributionInfo(uint256 distributionId)
        external
        view
        returns (
            uint256 totalAmount,
            uint256 distributed,
            uint256 timestamp,
            bool isCompleted,
            address[] memory recipients
        )
    {
        RoyaltyDistribution storage distribution = distributions[distributionId];
        return (
            distribution.totalAmount,
            distribution.distributed,
            distribution.timestamp,
            distribution.isCompleted,
            distribution.recipients
        );
    }
    
    /**
     * @dev Get recipient amount for a distribution
     * @param distributionId The distribution ID
     * @param recipient The recipient address
     * @return amount The amount allocated to recipient
     */
    function getRecipientAmount(uint256 distributionId, address recipient)
        external
        view
        returns (uint256 amount)
    {
        return distributions[distributionId].recipientAmounts[recipient];
    }
    
    /**
     * @dev Get pending withdrawal amount for an address
     * @param recipient The recipient address
     * @return amount The pending withdrawal amount
     */
    function getPendingWithdrawal(address recipient)
        external
        view
        returns (uint256 amount)
    {
        return pendingWithdrawals[recipient];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update default percentage distribution
     * @param newPercentages Array of new percentages
     */
    function updateDefaultPercentages(uint256[MAX_GENERATIONS] calldata newPercentages) 
        external 
        onlyRole(MANAGER_ROLE) 
    {
        uint256 total = 0;
        for (uint256 i = 0; i < MAX_GENERATIONS; i++) {
            total += newPercentages[i];
        }
        require(total <= MAX_TOTAL_PERCENTAGE, "RoyaltySplitter: Total exceeds 100%");
        
        defaultPercentages = newPercentages;
        
        emit DefaultPercentagesUpdated(newPercentages);
    }
    
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
     * @dev Emergency withdrawal of contract balance
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Check if a token exists
     * @param tokenId The token ID to check
     * @return exists Whether the token exists
     */
    function _tokenExists(uint256 tokenId) internal view returns (bool exists) {
        try IERC721(agentNFTContract).ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
    
    // ============ Receive Function ============
    
    /**
     * @dev Receive ETH directly (for simple royalty payments)
     */
    receive() external payable {
        // ETH received - can be used for emergency funding
    }
}