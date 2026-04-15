// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TNFSmartAccount.sol";

/**
 * @title TNFSmartAccountFactory
 * @dev Factory contract for deploying Smart Accounts for AI agents
 * Uses CREATE2 for deterministic addresses
 */
contract TNFSmartAccountFactory is Ownable {
    event SmartAccountCreated(
        address indexed account,
        address indexed owner,
        bytes32 indexed salt
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deploy a Smart Account for an AI agent
     * @param owner The owner address (derived from Web3Auth)
     * @param salt Unique salt for deterministic address generation
     * @return account The deployed Smart Account address
     */
    function createAccount(
        address owner,
        bytes32 salt
    ) external returns (TNFSmartAccount account) {
        require(owner != address(0), "Invalid owner address");

        bytes memory bytecode = abi.encodePacked(
            type(TNFSmartAccount).creationCode,
            abi.encode(owner)
        );

        address accountAddress = Create2.computeAddress(salt, keccak256(bytecode));
        
        // Check if account already exists
        if (accountAddress.code.length > 0) {
            return TNFSmartAccount(payable(accountAddress));
        }

        account = TNFSmartAccount(payable(Create2.deploy(0, salt, bytecode)));
        
        emit SmartAccountCreated(address(account), owner, salt);
    }

    /**
     * @dev Get the counterfactual address of a Smart Account
     * @param owner The owner address
     * @param salt The salt used for deployment
     * @return The predicted Smart Account address
     */
    function getAddress(
        address owner,
        bytes32 salt
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(TNFSmartAccount).creationCode,
            abi.encode(owner)
        );
        
        return Create2.computeAddress(salt, keccak256(bytecode));
    }

    /**
     * @dev Check if an account exists at the predicted address
     * @param owner The owner address
     * @param salt The salt used for deployment
     * @return exists Whether the account exists
     */
    function accountExists(
        address owner,
        bytes32 salt
    ) external view returns (bool exists) {
        address predictedAddress = this.getAddress(owner, salt);
        return predictedAddress.code.length > 0;
    }
}