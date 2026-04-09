// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/TNFPaymaster.sol";
import "../src/TNFSmartAccountFactory.sol";
import "../src/TNFSmartAccount.sol";

contract MockEntryPoint {
    mapping(address => uint256) public deposits;
    
    function depositTo(address account) external payable {
        deposits[account] += msg.value;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return deposits[account];
    }
}

contract TNFPaymasterTest is Test {
    TNFPaymaster paymaster;
    TNFSmartAccountFactory factory;
    MockEntryPoint entryPoint;
    
    address owner = makeAddr("owner");
    address agent1 = makeAddr("agent1");
    address agent2 = makeAddr("agent2");
    
    function setUp() public {
        entryPoint = new MockEntryPoint();
        paymaster = new TNFPaymaster(IEntryPoint(address(entryPoint)));
        factory = new TNFSmartAccountFactory();
        
        // Fund the test with some ETH
        vm.deal(address(this), 10 ether);
        vm.deal(owner, 1 ether);
    }
    
    function test_AuthorizeAgent() public {
        // Authorize an agent
        paymaster.authorizeAgent(agent1, 500000);
        
        // Check authorization
        assertTrue(paymaster.authorizedAgents(agent1));
        assertEq(paymaster.agentGasLimits(agent1), 500000);
        
        // Check event emission
        vm.expectEmit(true, false, false, true);
        emit TNFPaymaster.AgentAuthorized(agent2, 1000000); // default limit
        paymaster.authorizeAgent(agent2, 0);
    }
    
    function test_RevokeAgent() public {
        // First authorize
        paymaster.authorizeAgent(agent1, 500000);
        assertTrue(paymaster.authorizedAgents(agent1));
        
        // Then revoke
        paymaster.revokeAgent(agent1);
        assertFalse(paymaster.authorizedAgents(agent1));
        assertEq(paymaster.agentGasLimits(agent1), 0);
    }
    
    function test_DepositFunds() public {
        uint256 depositAmount = 1 ether;
        
        // Deposit funds to paymaster
        paymaster.deposit{value: depositAmount}();
        
        // Check that funds were deposited to EntryPoint
        assertEq(entryPoint.balanceOf(address(paymaster)), depositAmount);
    }
    
    function test_GetAgentInfo() public {
        // Authorize agent
        paymaster.authorizeAgent(agent1, 500000);
        
        // Get agent info
        (bool authorized, uint256 gasLimit, uint256 gasUsed, uint256 gasRemaining) = 
            paymaster.getAgentInfo(agent1);
        
        assertTrue(authorized);
        assertEq(gasLimit, 500000);
        assertEq(gasUsed, 0);
        assertEq(gasRemaining, 500000);
    }
    
    function test_OnlyOwnerFunctions() public {
        vm.prank(agent1);
        
        // Should revert when non-owner tries to authorize
        vm.expectRevert();
        paymaster.authorizeAgent(agent2, 100000);
        
        // Should revert when non-owner tries to revoke
        vm.expectRevert();
        paymaster.revokeAgent(agent1);
    }
    
    function test_SetGasLimits() public {
        // Set new default gas limit
        paymaster.setDefaultGasLimit(2000000);
        assertEq(paymaster.defaultGasLimit(), 2000000);
        
        // Set new max gas price
        paymaster.setMaxGasPrice(100 gwei);
        assertEq(paymaster.maxGasPrice(), 100 gwei);
    }
}