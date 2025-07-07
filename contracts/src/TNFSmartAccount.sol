// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";

/**
 * @title TNFSmartAccount
 * @dev ERC-4337 compliant Smart Account for AI agents
 * Supports signature validation and transaction execution
 */
contract TNFSmartAccount is BaseAccount, IERC721Receiver, IERC1155Receiver, IERC1271 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IEntryPoint private immutable _entryPoint;
    address public owner;

    event SmartAccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    modifier onlyOwnerOrEntryPoint() {
        require(
            msg.sender == owner || msg.sender == address(_entryPoint),
            "Account: not Owner or EntryPoint"
        );
        _;
    }

    constructor(address anOwner) {
        _entryPoint = IEntryPoint(msg.sender);
        owner = anOwner;
        emit SmartAccountInitialized(_entryPoint, anOwner);
    }

    /**
     * @dev Initialize the Smart Account with EntryPoint
     * This is called by the factory after deployment
     */
    function initialize(address anOwner) external {
        require(owner == address(0), "Account: already initialized");
        owner = anOwner;
        emit SmartAccountInitialized(_entryPoint, anOwner);
    }

    /**
     * @dev Transfer ownership of the Smart Account
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Account: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @dev Execute a transaction from this account
     * @param dest Destination address
     * @param value Ether value
     * @param func Call data
     */
    function execute(address dest, uint256 value, bytes calldata func) external onlyOwnerOrEntryPoint {
        _call(dest, value, func);
    }

    /**
     * @dev Execute a batch of transactions
     * @param dest Array of destination addresses
     * @param value Array of ether values
     * @param func Array of call data
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external onlyOwnerOrEntryPoint {
        require(dest.length == func.length, "Account: wrong array lengths");
        require(dest.length == value.length, "Account: wrong array lengths");
        
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    /**
     * @dev Get the EntryPoint for this Smart Account
     */
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * @dev Validate signature for ERC-4337 UserOperation
     * Supports both direct owner signatures and contract signatures
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        
        // Try to recover the signer from the signature
        address recovered = hash.recover(userOp.signature);
        
        if (recovered == owner) {
            return 0; // Valid signature
        }
        
        // For contract signatures (like Web3Auth MPC)
        if (owner.code.length > 0) {
            try IERC1271(owner).isValidSignature(hash, userOp.signature) returns (bytes4 result) {
                if (result == IERC1271.isValidSignature.selector) {
                    return 0; // Valid contract signature
                }
            } catch {}
        }
        
        return SIG_VALIDATION_FAILED;
    }

    /**
     * @dev ERC-1271 signature validation
     */
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view override returns (bytes4) {
        address recovered = hash.recover(signature);
        
        if (recovered == owner) {
            return IERC1271.isValidSignature.selector;
        }
        
        // Check if owner is a contract that supports ERC-1271
        if (owner.code.length > 0) {
            try IERC1271(owner).isValidSignature(hash, signature) returns (bytes4 result) {
                return result;
            } catch {
                return 0xffffffff;
            }
        }
        
        return 0xffffffff;
    }

    /**
     * @dev Internal function to execute calls
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * @dev Check if the caller is the owner
     */
    function _checkOwner() internal view {
        require(msg.sender == owner, "Account: not owner");
    }

    /**
     * @dev Support for receiving NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Support for receiving ERC-1155 tokens
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    /**
     * @dev Support for batch receiving ERC-1155 tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    /**
     * @dev Support for ERC-165 interface detection
     */
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @dev Allow the account to receive Ether
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}