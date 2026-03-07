// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/core/UserOperationLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title TNFPaymaster
 * @dev Custom Paymaster for The New Fuse AI Agent platform
 * Sponsors gas for verified AI agent Smart Accounts
 */
contract TNFPaymaster is BasePaymaster, Ownable {
    using UserOperationLib for PackedUserOperation;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    mapping(address => bool) public authorizedAccounts; // Both humans and AI agents
    mapping(address => uint256) public accountGasLimits;
    mapping(address => uint256) public accountGasUsed;
    mapping(address => string) public accountTypes; // "HUMAN" or "AI"
    
    uint256 public defaultGasLimit = 1000000; // 1M gas default limit per agent
    uint256 public maxGasPrice = 50 gwei; // Maximum gas price we'll sponsor

    event AccountAuthorized(address indexed account, string accountType, uint256 gasLimit);
    event AccountRevoked(address indexed account);
    event GasSponsored(address indexed account, string accountType, uint256 gasUsed, uint256 actualGasCost);

    constructor(IEntryPoint _entryPoint) BasePaymaster(_entryPoint) Ownable(msg.sender) {}

    /**
     * @dev Authorize a Smart Account for gas sponsorship (human or AI)
     * @param account The Smart Account address
     * @param accountType "HUMAN" or "AI"
     * @param gasLimit The gas limit for this account (0 for default)
     */
    function authorizeAccount(address account, string calldata accountType, uint256 gasLimit) external onlyOwner {
        require(account != address(0), "Invalid account address");
        require(
            keccak256(bytes(accountType)) == keccak256(bytes("HUMAN")) || 
            keccak256(bytes(accountType)) == keccak256(bytes("AI")),
            "Invalid account type"
        );
        
        authorizedAccounts[account] = true;
        accountGasLimits[account] = gasLimit > 0 ? gasLimit : defaultGasLimit;
        accountTypes[account] = accountType;
        
        emit AccountAuthorized(account, accountType, accountGasLimits[account]);
    }

    /**
     * @dev Revoke authorization for an account
     * @param account The Smart Account address to revoke
     */
    function revokeAccount(address account) external onlyOwner {
        require(authorizedAccounts[account], "Account not authorized");
        
        authorizedAccounts[account] = false;
        delete accountGasLimits[account];
        delete accountGasUsed[account];
        delete accountTypes[account];
        
        emit AccountRevoked(account);
    }

    // Legacy methods for backward compatibility
    function authorizeAgent(address agent, uint256 gasLimit) external onlyOwner {
        authorizeAccount(agent, "AI", gasLimit);
    }

    function revokeAgent(address agent) external onlyOwner {
        revokeAccount(agent);
    }

    /**
     * @dev Validate paymaster user operation
     * Sponsors gas for authorized Smart Accounts (both human and AI) within their limits
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal view override returns (bytes memory context, uint256 validationData) {
        // Check if the sender (Smart Account) is authorized
        address sender = userOp.sender;
        require(authorizedAccounts[sender], "TNFPaymaster: Sender not authorized");

        // Check gas price limits
        uint256 gasPrice = userOp.unpackMaxFeePerGas();
        require(gasPrice <= maxGasPrice, "TNFPaymaster: Gas price too high");

        // Check account's gas usage limits
        uint256 estimatedGas = userOp.unpackCallGasLimit() + 
                              userOp.unpackVerificationGasLimit() + 
                              userOp.unpackPreVerificationGas();
        
        require(
            accountGasUsed[sender] + estimatedGas <= accountGasLimits[sender],
            "TNFPaymaster: Account gas limit exceeded"
        );

        // Return context with sender address and account type for postOp
        return (abi.encode(sender, estimatedGas, accountTypes[sender]), 0);
    }

    /**
     * @dev Post-operation hook to track gas usage
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualGasUsed
    ) internal override {
        if (mode == PostOpMode.opSucceeded || mode == PostOpMode.opReverted) {
            (address account, uint256 estimatedGas, string memory accountType) = 
                abi.decode(context, (address, uint256, string));
            
            // Update account's gas usage
            accountGasUsed[account] += actualGasUsed;
            
            emit GasSponsored(account, accountType, actualGasUsed, actualGasCost);
        }
    }

    /**
     * @dev Reset gas usage for an account (admin function)
     */
    function resetAccountGasUsage(address account) external onlyOwner {
        require(authorizedAccounts[account], "Account not authorized");
        accountGasUsed[account] = 0;
    }

    // Legacy method for backward compatibility
    function resetAgentGasUsage(address agent) external onlyOwner {
        resetAccountGasUsage(agent);
    }

    /**
     * @dev Update default gas limit
     */
    function setDefaultGasLimit(uint256 newLimit) external onlyOwner {
        require(newLimit > 0, "Invalid gas limit");
        defaultGasLimit = newLimit;
    }

    /**
     * @dev Update maximum gas price
     */
    function setMaxGasPrice(uint256 newMaxGasPrice) external onlyOwner {
        require(newMaxGasPrice > 0, "Invalid gas price");
        maxGasPrice = newMaxGasPrice;
    }

    /**
     * @dev Withdraw funds from the paymaster
     */
    function withdrawTo(address payable withdrawAddress, uint256 amount) external onlyOwner {
        require(withdrawAddress != address(0), "Invalid address");
        (bool success, ) = withdrawAddress.call{value: amount}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Add funds to the paymaster
     */
    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /**
     * @dev Get account information
     */
    function getAccountInfo(address account) external view returns (
        bool authorized,
        string memory accountType,
        uint256 gasLimit,
        uint256 gasUsed,
        uint256 gasRemaining
    ) {
        authorized = authorizedAccounts[account];
        accountType = accountTypes[account];
        gasLimit = accountGasLimits[account];
        gasUsed = accountGasUsed[account];
        gasRemaining = authorized ? (gasLimit > gasUsed ? gasLimit - gasUsed : 0) : 0;
    }

    // Legacy method for backward compatibility
    function getAgentInfo(address agent) external view returns (
        bool authorized,
        uint256 gasLimit,
        uint256 gasUsed,
        uint256 gasRemaining
    ) {
        authorized = authorizedAccounts[agent];
        gasLimit = accountGasLimits[agent];
        gasUsed = accountGasUsed[agent];
        gasRemaining = authorized ? (gasLimit > gasUsed ? gasLimit - gasUsed : 0) : 0;
    }
}