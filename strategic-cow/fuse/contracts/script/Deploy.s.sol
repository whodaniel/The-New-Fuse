// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/TNFPaymaster.sol";
import "../src/TNFSmartAccountFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address entryPoint = vm.envAddress("ENTRY_POINT"); // 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 for mainnet/testnet
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Smart Account Factory
        TNFSmartAccountFactory factory = new TNFSmartAccountFactory();
        console.log("TNFSmartAccountFactory deployed at:", address(factory));

        // Deploy the Paymaster
        TNFPaymaster paymaster = new TNFPaymaster(IEntryPoint(entryPoint));
        console.log("TNFPaymaster deployed at:", address(paymaster));

        // Fund the paymaster with some ETH for gas sponsorship
        uint256 paymasterFunding = vm.envOr("PAYMASTER_FUNDING", uint256(1 ether));
        paymaster.deposit{value: paymasterFunding}();
        console.log("Paymaster funded with:", paymasterFunding);

        vm.stopBroadcast();

        // Log deployment addresses for backend integration
        console.log("\n=== Deployment Summary ===");
        console.log("Factory Address:", address(factory));
        console.log("Paymaster Address:", address(paymaster));
        console.log("EntryPoint Address:", entryPoint);
        console.log("==========================");
    }
}