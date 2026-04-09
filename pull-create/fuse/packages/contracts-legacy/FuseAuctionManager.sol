// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FuseAuctionManager is ReentrancyGuard, Ownable {
    struct Auction {
        uint256 tokenId;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool active;
        bool isRental;
    }
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256) public pendingReturns;

    constructor() Ownable(msg.sender) {}

    function startAuction(uint256 _id, uint256 _floor, uint256 _duration, bool _isRental) external onlyOwner {
        auctions[_id] = Auction(_id, address(0), _floor, block.timestamp + _duration, true, _isRental);
    }

    function placeBid(uint256 _id) external payable nonReentrant {
        Auction storage a = auctions[_id];
        require(a.active && block.timestamp < a.endTime, "Inactive");
        require(msg.value > a.highestBid, "Bid too low");

        if (a.highestBidder != address(0)) {
            pendingReturns[a.highestBidder] += a.highestBid;
        }
        a.highestBidder = msg.sender;
        a.highestBid = msg.value;
        if (a.endTime - block.timestamp < 10 minutes) a.endTime += 10 minutes;
    }

    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
