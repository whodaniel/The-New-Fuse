// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@solvprotocol/erc-3525/ERC3525.sol";

contract AgentSponsorshipSFT is ERC3525, ReentrancyGuard, Ownable {
    IERC721 public immutable udRegistry;

    struct AgentIdentity {
        uint256 udTokenId;
        address smartWallet;
        uint256 totalShares;
        uint256 revenuePerShare;
    }
    mapping(uint256 => AgentIdentity) public agents;
    mapping(uint256 => uint256) public dividendDebt;

    constructor(address _udRegistry)
        ERC3525("The New Fuse Agent Share", "FUSE-SFT", 18)
        Ownable(msg.sender)
    {
        udRegistry = IERC721(_udRegistry);
    }

    function initializeAgent(uint256 _slot, uint256 _udTokenId, address _agentWallet) external onlyOwner {
        udRegistry.transferFrom(msg.sender, address(this), _udTokenId);
        agents[_slot] = AgentIdentity({ udTokenId: _udTokenId, smartWallet: _agentWallet, totalShares: 0, revenuePerShare: 0 });
    }

    function mintSponsorship(address _to, uint256 _slot, uint256 _amount) external onlyOwner {
        uint256 tokenId = _mint(_to, _slot, _amount);
        agents[_slot].totalShares += _amount;
        dividendDebt[tokenId] = _amount * agents[_slot].revenuePerShare;
    }

    function depositRevenue(uint256 _slot) external payable nonReentrant {
        require(agents[_slot].totalShares > 0, "No shares minted");
        agents[_slot].revenuePerShare += (msg.value * 1e18) / agents[_slot].totalShares;
    }

    function claimDividends(uint256 _tokenId) external nonReentrant {
        uint256 slot = slotOf(_tokenId);
        uint256 balance = balanceOf(_tokenId);
        uint256 accumulated = (balance * agents[slot].revenuePerShare) / 1e18;
        uint256 amount = accumulated - dividendDebt[_tokenId];
        require(amount > 0, "Nothing to claim");
        dividendDebt[_tokenId] = accumulated;
        payable(ownerOf(_tokenId)).transfer(amount);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // Helper to get total shares for an agent (slot) - implicitly needed by RevenueRouter
    function getTotalShares(uint256 _slot) external view returns (uint256) {
        return agents[_slot].totalShares;
    }
}
