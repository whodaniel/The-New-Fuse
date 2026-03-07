// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BaseAgentContract
 * @dev Base contract with common functionality for all agent-related contracts
 * 
 * Provides:
 * - Standardized role definitions
 * - Common access control patterns
 * - Emergency pause/unpause functionality
 * - Reentrancy protection
 * - Event emission standards
 */
abstract contract BaseAgentContract is AccessControl, Pausable, ReentrancyGuard {
    
    // ============ Common Role Definitions ============
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // ============ Common State Variables ============
    
    address public agentNFTContract;
    
    // ============ Events ============
    
    event ContractPaused(address indexed pauser);
    event ContractUnpaused(address indexed unpauser);
    event EmergencyAction(address indexed actor, string action, bytes data);
    
    // ============ Modifiers ============
    
    /**
     * @dev Modifier to check if agent NFT exists
     * @param tokenId The token ID to check
     */
    modifier tokenExists(uint256 tokenId) {
        require(_tokenExists(tokenId), "BaseAgentContract: Token does not exist");
        _;
    }
    
    /**
     * @dev Modifier to validate non-zero address
     * @param addr The address to validate
     */
    modifier validAddress(address addr) {
        require(addr != address(0), "BaseAgentContract: Invalid address");
        _;
    }
    
    /**
     * @dev Modifier to validate percentage (0-10000 basis points)
     * @param percentage The percentage to validate
     */
    modifier validPercentage(uint256 percentage) {
        require(percentage <= 10000, "BaseAgentContract: Percentage exceeds 100%");
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @dev Initialize base contract with admin and NFT contract
     * @param defaultAdmin The default admin address
     * @param _agentNFTContract The agent NFT contract address
     */
    constructor(address defaultAdmin, address _agentNFTContract) {
        require(defaultAdmin != address(0), "BaseAgentContract: Invalid admin");
        require(_agentNFTContract != address(0), "BaseAgentContract: Invalid NFT contract");
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ORACLE_ROLE, defaultAdmin);
        _grantRole(MANAGER_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        
        agentNFTContract = _agentNFTContract;
    }
    
    // ============ Common Admin Functions ============
    
    /**
     * @dev Emergency pause functionality
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
    
    /**
     * @dev Update agent NFT contract address
     * @param newAgentNFTContract New contract address
     */
    function updateAgentNFTContract(address newAgentNFTContract) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE)
        validAddress(newAgentNFTContract)
    {
        address oldContract = agentNFTContract;
        agentNFTContract = newAgentNFTContract;
        
        emit EmergencyAction(
            msg.sender, 
            "updateAgentNFTContract", 
            abi.encode(oldContract, newAgentNFTContract)
        );
    }
    
    /**
     * @dev Emergency withdrawal of ETH
     */
    function emergencyWithdrawETH() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "BaseAgentContract: No ETH to withdraw");
        
        payable(msg.sender).transfer(balance);
        
        emit EmergencyAction(
            msg.sender, 
            "emergencyWithdrawETH", 
            abi.encode(balance)
        );
    }
    
    // ============ Common Utility Functions ============
    
    /**
     * @dev Check if a token exists by calling ownerOf
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
    
    /**
     * @dev Get the owner of a token
     * @param tokenId The token ID
     * @return owner The owner address
     */
    function _getTokenOwner(uint256 tokenId) internal view returns (address owner) {
        return IERC721(agentNFTContract).ownerOf(tokenId);
    }
    
    /**
     * @dev Validate array lengths match
     * @param array1Length Length of first array
     * @param array2Length Length of second array
     */
    function _validateArrayLengths(uint256 array1Length, uint256 array2Length) internal pure {
        require(array1Length == array2Length, "BaseAgentContract: Array length mismatch");
    }
    
    /**
     * @dev Calculate percentage of amount
     * @param amount The amount to calculate percentage of
     * @param percentage The percentage in basis points
     * @return result The calculated amount
     */
    function _calculatePercentage(uint256 amount, uint256 percentage) internal pure returns (uint256 result) {
        return (amount * percentage) / 10000;
    }
    
    /**
     * @dev Safely transfer ETH
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _safeTransferETH(address to, uint256 amount) internal {
        require(to != address(0), "BaseAgentContract: Transfer to zero address");
        require(amount > 0, "BaseAgentContract: Zero amount transfer");
        require(address(this).balance >= amount, "BaseAgentContract: Insufficient balance");
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "BaseAgentContract: ETH transfer failed");
    }
    
    // ============ Interface Support ============
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

// Import statement for IERC721
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";