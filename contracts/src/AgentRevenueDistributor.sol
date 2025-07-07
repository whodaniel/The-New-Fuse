// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentNFT.sol";

/**
 * @title AgentRevenueDistributor
 * @dev Handles automated revenue distribution for Agent NFTs
 * Supports multiple revenue streams and automatic payouts
 */
contract AgentRevenueDistributor is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct RevenueStream {
        uint256 agentTokenId;
        address revenueToken; // address(0) for ETH
        uint256 totalRevenue;
        uint256 distributedRevenue;
        uint256 lastDistribution;
        bool isActive;
        uint256 minimumDistribution; // Minimum amount before distribution
        uint256 distributionFrequency; // Minimum time between distributions
    }

    struct PayoutRecord {
        uint256 agentTokenId;
        address recipient;
        address token;
        uint256 amount;
        uint256 timestamp;
        string revenueSource;
    }

    AgentNFT public immutable agentNFT;
    
    uint256 private _revenueStreamIdCounter;
    uint256 private _payoutIdCounter;
    
    // Distribution fee (basis points, 100 = 1%)
    uint256 public distributionFee = 100;
    
    // Minimum distribution threshold (0.01 ETH)
    uint256 public constant DEFAULT_MIN_DISTRIBUTION = 0.01 ether;
    
    // Default distribution frequency (24 hours)
    uint256 public constant DEFAULT_DISTRIBUTION_FREQUENCY = 24 hours;

    mapping(uint256 => RevenueStream) public revenueStreams;
    mapping(uint256 => uint256[]) public agentRevenueStreams; // Agent ID -> Revenue Stream IDs
    mapping(uint256 => PayoutRecord) public payoutRecords;
    mapping(address => uint256) public totalFeesCollected; // Token -> Total fees

    event RevenueStreamCreated(
        uint256 indexed streamId,
        uint256 indexed agentTokenId,
        address indexed revenueToken
    );
    
    event RevenueAdded(
        uint256 indexed streamId,
        uint256 indexed agentTokenId,
        address indexed token,
        uint256 amount,
        string source
    );
    
    event RevenueDistributed(
        uint256 indexed streamId,
        uint256 indexed agentTokenId,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event PayoutMade(
        uint256 indexed payoutId,
        uint256 indexed agentTokenId,
        address indexed recipient,
        address token,
        uint256 amount
    );

    modifier onlyAgentOwnerOrOperator(uint256 agentTokenId) {
        require(
            agentNFT.ownerOf(agentTokenId) == msg.sender || 
            agentNFT.agentOperators(agentTokenId, msg.sender),
            "Not authorized to manage this agent"
        );
        _;
    }

    constructor(address _agentNFT) Ownable(msg.sender) {
        agentNFT = AgentNFT(_agentNFT);
    }

    /**
     * @dev Create a new revenue stream for an agent
     */
    function createRevenueStream(
        uint256 agentTokenId,
        address revenueToken,
        uint256 minimumDistribution,
        uint256 distributionFrequency
    ) external onlyAgentOwnerOrOperator(agentTokenId) returns (uint256 streamId) {
        require(agentNFT.ownerOf(agentTokenId) != address(0), "Agent does not exist");
        
        if (minimumDistribution == 0) {
            minimumDistribution = DEFAULT_MIN_DISTRIBUTION;
        }
        if (distributionFrequency == 0) {
            distributionFrequency = DEFAULT_DISTRIBUTION_FREQUENCY;
        }

        streamId = _revenueStreamIdCounter++;
        
        revenueStreams[streamId] = RevenueStream({
            agentTokenId: agentTokenId,
            revenueToken: revenueToken,
            totalRevenue: 0,
            distributedRevenue: 0,
            lastDistribution: block.timestamp,
            isActive: true,
            minimumDistribution: minimumDistribution,
            distributionFrequency: distributionFrequency
        });

        agentRevenueStreams[agentTokenId].push(streamId);

        emit RevenueStreamCreated(streamId, agentTokenId, revenueToken);
    }

    /**
     * @dev Add revenue to a stream
     */
    function addRevenue(
        uint256 streamId,
        uint256 amount,
        string memory source
    ) external payable nonReentrant {
        RevenueStream storage stream = revenueStreams[streamId];
        require(stream.isActive, "Revenue stream not active");

        if (stream.revenueToken == address(0)) {
            // ETH revenue
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            // ERC20 token revenue
            require(msg.value == 0, "Should not send ETH for token revenue");
            IERC20(stream.revenueToken).safeTransferFrom(msg.sender, address(this), amount);
        }

        stream.totalRevenue += amount;

        emit RevenueAdded(streamId, stream.agentTokenId, stream.revenueToken, amount, source);

        // Auto-distribute if conditions are met
        _tryAutoDistribute(streamId);
    }

    /**
     * @dev Manually distribute revenue for a stream
     */
    function distributeRevenue(uint256 streamId) external nonReentrant {
        _distributeRevenueInternal(streamId);
    }

    /**
     * @dev Distribute revenue for all streams of an agent
     */
    function distributeAllAgentRevenue(uint256 agentTokenId) external nonReentrant {
        uint256[] memory streamIds = agentRevenueStreams[agentTokenId];
        for (uint256 i = 0; i < streamIds.length; i++) {
            _tryAutoDistribute(streamIds[i]);
        }
    }

    /**
     * @dev Internal function to try automatic distribution
     */
    function _tryAutoDistribute(uint256 streamId) internal {
        RevenueStream storage stream = revenueStreams[streamId];
        
        uint256 pendingRevenue = stream.totalRevenue - stream.distributedRevenue;
        bool enoughTime = block.timestamp >= stream.lastDistribution + stream.distributionFrequency;
        bool enoughAmount = pendingRevenue >= stream.minimumDistribution;

        if (enoughTime && enoughAmount) {
            _distributeRevenueInternal(streamId);
        }
    }

    /**
     * @dev Internal function to distribute revenue
     */
    function _distributeRevenueInternal(uint256 streamId) internal {
        RevenueStream storage stream = revenueStreams[streamId];
        require(stream.isActive, "Revenue stream not active");

        uint256 pendingRevenue = stream.totalRevenue - stream.distributedRevenue;
        require(pendingRevenue > 0, "No pending revenue");

        // Calculate distribution fee
        uint256 feeAmount = (pendingRevenue * distributionFee) / 10000;
        uint256 distributionAmount = pendingRevenue - feeAmount;

        // Get fractional shares from AgentNFT
        AgentNFT.FractionalShare[] memory shares = agentNFT.getFractionalShares(stream.agentTokenId);
        
        uint256 recipientCount = 0;
        uint256 totalDistributed = 0;

        // Distribute to fractional owners
        for (uint256 i = 0; i < shares.length; i++) {
            uint256 shareAmount = (distributionAmount * shares[i].percentage) / 10000;
            if (shareAmount > 0) {
                _sendPayout(
                    stream.agentTokenId,
                    shares[i].owner,
                    stream.revenueToken,
                    shareAmount,
                    "Fractional ownership revenue"
                );
                totalDistributed += shareAmount;
                recipientCount++;
            }
        }

        // Send remaining amount to NFT owner
        uint256 ownerPercentage = 10000 - agentNFT.getTotalFractionalShares(stream.agentTokenId);
        if (ownerPercentage > 0) {
            uint256 ownerAmount = (distributionAmount * ownerPercentage) / 10000;
            if (ownerAmount > 0) {
                _sendPayout(
                    stream.agentTokenId,
                    agentNFT.ownerOf(stream.agentTokenId),
                    stream.revenueToken,
                    ownerAmount,
                    "NFT ownership revenue"
                );
                totalDistributed += ownerAmount;
                recipientCount++;
            }
        }

        // Update stream state
        stream.distributedRevenue += pendingRevenue;
        stream.lastDistribution = block.timestamp;

        // Collect fees
        if (feeAmount > 0) {
            totalFeesCollected[stream.revenueToken] += feeAmount;
        }

        emit RevenueDistributed(streamId, stream.agentTokenId, distributionAmount, recipientCount);
    }

    /**
     * @dev Internal function to send payout
     */
    function _sendPayout(
        uint256 agentTokenId,
        address recipient,
        address token,
        uint256 amount,
        string memory source
    ) internal {
        uint256 payoutId = _payoutIdCounter++;
        
        payoutRecords[payoutId] = PayoutRecord({
            agentTokenId: agentTokenId,
            recipient: recipient,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            revenueSource: source
        });

        if (token == address(0)) {
            // Send ETH
            payable(recipient).transfer(amount);
        } else {
            // Send ERC20 token
            IERC20(token).safeTransfer(recipient, amount);
        }

        emit PayoutMade(payoutId, agentTokenId, recipient, token, amount);
    }

    /**
     * @dev Set revenue stream active status
     */
    function setRevenueStreamActive(
        uint256 streamId,
        bool active
    ) external {
        RevenueStream storage stream = revenueStreams[streamId];
        require(
            agentNFT.ownerOf(stream.agentTokenId) == msg.sender || 
            agentNFT.agentOperators(stream.agentTokenId, msg.sender),
            "Not authorized"
        );
        
        stream.isActive = active;
    }

    /**
     * @dev Update distribution parameters
     */
    function updateDistributionParameters(
        uint256 streamId,
        uint256 minimumDistribution,
        uint256 distributionFrequency
    ) external {
        RevenueStream storage stream = revenueStreams[streamId];
        require(
            agentNFT.ownerOf(stream.agentTokenId) == msg.sender || 
            agentNFT.agentOperators(stream.agentTokenId, msg.sender),
            "Not authorized"
        );
        
        stream.minimumDistribution = minimumDistribution;
        stream.distributionFrequency = distributionFrequency;
    }

    /**
     * @dev Get revenue streams for an agent
     */
    function getAgentRevenueStreams(uint256 agentTokenId) external view returns (uint256[] memory) {
        return agentRevenueStreams[agentTokenId];
    }

    /**
     * @dev Get revenue stream info
     */
    function getRevenueStreamInfo(uint256 streamId) external view returns (
        uint256 agentTokenId,
        address revenueToken,
        uint256 totalRevenue,
        uint256 distributedRevenue,
        uint256 pendingRevenue,
        uint256 lastDistribution,
        bool isActive
    ) {
        RevenueStream storage stream = revenueStreams[streamId];
        return (
            stream.agentTokenId,
            stream.revenueToken,
            stream.totalRevenue,
            stream.distributedRevenue,
            stream.totalRevenue - stream.distributedRevenue,
            stream.lastDistribution,
            stream.isActive
        );
    }

    /**
     * @dev Update distribution fee (only owner)
     */
    function setDistributionFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee cannot exceed 5%");
        distributionFee = newFee;
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees(address token) external onlyOwner {
        uint256 amount = totalFeesCollected[token];
        require(amount > 0, "No fees to withdraw");
        
        totalFeesCollected[token] = 0;
        
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @dev Emergency function to recover stuck tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}