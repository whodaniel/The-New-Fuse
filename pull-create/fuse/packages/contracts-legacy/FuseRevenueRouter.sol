// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentSponsorshipSFT.sol";
import "./FuseAgencyRegistry.sol";

contract FuseRevenueRouter is ReentrancyGuard, Ownable {
    AgentSponsorshipSFT public sftContract;
    FuseAgencyRegistry public agencyRegistry;
    address public tnfTreasury;
    
    mapping(address => address) public referrers;
    mapping(uint256 => uint256) public affiliateRevenuePerShare;
    mapping(uint256 => uint256) public affiliateDebt;

    constructor(address _sft, address _registry, address _treasury) Ownable(msg.sender) {
        sftContract = AgentSponsorshipSFT(_sft);
        agencyRegistry = FuseAgencyRegistry(_registry);
        tnfTreasury = _treasury;
    }

    function linkInvestor(address _investor, address _referrer) external {
        require(referrers[_investor] == address(0), "Already linked");
        referrers[_investor] = _referrer;
    }

    function routeRevenue(uint256 _agentId, uint256 _licenseId) external payable nonReentrant {
        if (agencyRegistry.isSovereign(_licenseId)) {
            // Agency 60/30/10 Model
            uint256 total = msg.value;
            uint256 house = (total * 6000) / 10000;
            uint256 investors = (total * 3000) / 10000;
            uint256 affiliates = total - (house + investors);
            
            // Send House Share (Mock function for treasury retrieval - in reality would look up owner)
            // address agencyOwner = agencyRegistry.ownerOf(_licenseId);
            // payable(agencyOwner).transfer(house);
            
            // Distribute Investor Share
            sftContract.depositRevenue{value: investors}(_agentId);
            
            // Distribute Affiliate Share (Index update)
            uint256 shares = sftContract.getTotalShares(_agentId);
            if (shares > 0) {
                affiliateRevenuePerShare[_agentId] += (affiliates * 1e18) / shares;
            }
        } else {
            // TNF 70/30 Model
            uint256 tnfShare = (msg.value * 7000) / 10000;
            payable(tnfTreasury).transfer(tnfShare);
            sftContract.depositRevenue{value: msg.value - tnfShare}(_agentId);
        }
    }

    function claimAffiliateEarnings(uint256 _tokenId) external nonReentrant {
        uint256 slotId = sftContract.slotOf(_tokenId);
        address investor = sftContract.ownerOf(_tokenId);
        address referrer = referrers[investor];
        require(referrer != address(0), "No referrer");
        
        uint256 balance = sftContract.balanceOf(_tokenId);
        uint256 accumulated = (balance * affiliateRevenuePerShare[slotId]) / 1e18;
        uint256 amount = accumulated - affiliateDebt[_tokenId];
        
        if (amount > 0) {
            affiliateDebt[_tokenId] = accumulated;
            payable(referrer).transfer(amount);
        }
    }
}
