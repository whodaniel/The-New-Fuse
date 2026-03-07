// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AgentNFT.sol";

/**
 * @title AgentFractionalMarketplace
 * @dev Marketplace for trading fractional ownership shares of Agent NFTs
 */
contract AgentFractionalMarketplace is ReentrancyGuard, Ownable {
    
    struct Listing {
        uint256 agentTokenId;
        address seller;
        uint256 shareIndex; // Index in the AgentNFT fractional shares array
        uint256 percentage;
        uint256 price;
        bool isActive;
        uint256 listedAt;
        uint256 expiresAt;
    }

    struct Offer {
        uint256 listingId;
        address buyer;
        uint256 offerPrice;
        uint256 offerExpiry;
        bool isActive;
    }

    AgentNFT public immutable agentNFT;
    
    uint256 private _listingIdCounter;
    uint256 private _offerIdCounter;
    
    // Marketplace fee (basis points, 250 = 2.5%)
    uint256 public marketplaceFee = 250;
    
    // Minimum listing duration (24 hours)
    uint256 public constant MIN_LISTING_DURATION = 24 hours;
    
    // Maximum listing duration (30 days)
    uint256 public constant MAX_LISTING_DURATION = 30 days;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    mapping(uint256 => uint256[]) public agentListings; // Agent ID -> Listing IDs
    mapping(address => uint256[]) public userListings; // User -> Listing IDs
    mapping(uint256 => uint256[]) public listingOffers; // Listing ID -> Offer IDs

    event ShareListed(
        uint256 indexed listingId,
        uint256 indexed agentTokenId,
        address indexed seller,
        uint256 percentage,
        uint256 price
    );
    
    event ShareSold(
        uint256 indexed listingId,
        uint256 indexed agentTokenId,
        address indexed seller,
        address buyer,
        uint256 percentage,
        uint256 price
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed buyer,
        uint256 offerPrice
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    
    event OfferCancelled(uint256 indexed offerId);

    modifier validListing(uint256 listingId) {
        require(listings[listingId].isActive, "Listing not active");
        require(block.timestamp <= listings[listingId].expiresAt, "Listing expired");
        _;
    }

    modifier onlyShareOwner(uint256 agentTokenId, uint256 shareIndex) {
        // Get the fractional share owner from AgentNFT contract
        AgentNFT.FractionalShare[] memory shares = agentNFT.getFractionalShares(agentTokenId);
        require(shareIndex < shares.length, "Invalid share index");
        require(shares[shareIndex].owner == msg.sender, "Not share owner");
        _;
    }

    constructor(address _agentNFT) Ownable(msg.sender) {
        agentNFT = AgentNFT(_agentNFT);
    }

    /**
     * @dev List a fractional share for sale
     */
    function listShare(
        uint256 agentTokenId,
        uint256 shareIndex,
        uint256 price,
        uint256 duration
    ) external onlyShareOwner(agentTokenId, shareIndex) returns (uint256 listingId) {
        require(price > 0, "Price must be greater than 0");
        require(duration >= MIN_LISTING_DURATION && duration <= MAX_LISTING_DURATION, "Invalid duration");

        // Get share details
        AgentNFT.FractionalShare[] memory shares = agentNFT.getFractionalShares(agentTokenId);
        require(shareIndex < shares.length, "Invalid share index");
        
        uint256 percentage = shares[shareIndex].percentage;

        listingId = _listingIdCounter++;
        
        listings[listingId] = Listing({
            agentTokenId: agentTokenId,
            seller: msg.sender,
            shareIndex: shareIndex,
            percentage: percentage,
            price: price,
            isActive: true,
            listedAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });

        agentListings[agentTokenId].push(listingId);
        userListings[msg.sender].push(listingId);

        emit ShareListed(listingId, agentTokenId, msg.sender, percentage, price);
    }

    /**
     * @dev Buy a listed fractional share
     */
    function buyShare(uint256 listingId) external payable validListing(listingId) nonReentrant {
        Listing storage listing = listings[listingId];
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        require(msg.value >= listing.price, "Insufficient payment");

        uint256 marketplaceFeeAmount = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - marketplaceFeeAmount;

        // Mark listing as inactive
        listing.isActive = false;

        // Transfer ownership of the fractional share
        // This would require modifying the AgentNFT contract to support transfers
        _transferFractionalShare(listing.agentTokenId, listing.shareIndex, listing.seller, msg.sender);

        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        if (marketplaceFeeAmount > 0) {
            payable(owner()).transfer(marketplaceFeeAmount);
        }

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit ShareSold(
            listingId,
            listing.agentTokenId,
            listing.seller,
            msg.sender,
            listing.percentage,
            listing.price
        );
    }

    /**
     * @dev Make an offer on a listing
     */
    function makeOffer(
        uint256 listingId,
        uint256 offerExpiry
    ) external payable validListing(listingId) nonReentrant {
        require(msg.value > 0, "Offer must be greater than 0");
        require(offerExpiry > block.timestamp, "Invalid expiry time");
        require(listings[listingId].seller != msg.sender, "Cannot offer on your own listing");

        uint256 offerId = _offerIdCounter++;
        
        offers[offerId] = Offer({
            listingId: listingId,
            buyer: msg.sender,
            offerPrice: msg.value,
            offerExpiry: offerExpiry,
            isActive: true
        });

        listingOffers[listingId].push(offerId);

        emit OfferMade(offerId, listingId, msg.sender, msg.value);
    }

    /**
     * @dev Accept an offer
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Offer not active");
        require(block.timestamp <= offer.offerExpiry, "Offer expired");

        Listing storage listing = listings[offer.listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not listing owner");

        uint256 marketplaceFeeAmount = (offer.offerPrice * marketplaceFee) / 10000;
        uint256 sellerAmount = offer.offerPrice - marketplaceFeeAmount;

        // Mark both offer and listing as inactive
        offer.isActive = false;
        listing.isActive = false;

        // Transfer ownership of the fractional share
        _transferFractionalShare(listing.agentTokenId, listing.shareIndex, listing.seller, offer.buyer);

        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        if (marketplaceFeeAmount > 0) {
            payable(owner()).transfer(marketplaceFeeAmount);
        }

        emit OfferAccepted(offerId, offer.listingId, listing.seller, offer.buyer, offer.offerPrice);
        emit ShareSold(
            offer.listingId,
            listing.agentTokenId,
            listing.seller,
            offer.buyer,
            listing.percentage,
            offer.offerPrice
        );
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.isActive, "Listing not active");

        listing.isActive = false;
        emit ListingCancelled(listingId);
    }

    /**
     * @dev Cancel an offer and refund
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.buyer == msg.sender, "Not offer owner");
        require(offer.isActive, "Offer not active");

        offer.isActive = false;
        payable(msg.sender).transfer(offer.offerPrice);

        emit OfferCancelled(offerId);
    }

    /**
     * @dev Internal function to transfer fractional share ownership
     * This is a placeholder - the actual implementation would depend on 
     * how fractional shares are stored and managed in the AgentNFT contract
     */
    function _transferFractionalShare(
        uint256 agentTokenId,
        uint256 shareIndex,
        address from,
        address to
    ) internal {
        // This would require additional functionality in AgentNFT contract
        // to support transferring fractional ownership
        // For now, this is a placeholder
    }

    /**
     * @dev Get active listings for an agent
     */
    function getAgentListings(uint256 agentTokenId) external view returns (uint256[] memory) {
        uint256[] memory allListings = agentListings[agentTokenId];
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].isActive && block.timestamp <= listings[allListings[i]].expiresAt) {
                activeCount++;
            }
        }

        // Create array of active listings
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].isActive && block.timestamp <= listings[allListings[i]].expiresAt) {
                activeListings[index] = allListings[i];
                index++;
            }
        }

        return activeListings;
    }

    /**
     * @dev Get offers for a listing
     */
    function getListingOffers(uint256 listingId) external view returns (uint256[] memory) {
        uint256[] memory allOffers = listingOffers[listingId];
        uint256 activeCount = 0;

        // Count active offers
        for (uint256 i = 0; i < allOffers.length; i++) {
            if (offers[allOffers[i]].isActive && block.timestamp <= offers[allOffers[i]].offerExpiry) {
                activeCount++;
            }
        }

        // Create array of active offers
        uint256[] memory activeOffers = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allOffers.length; i++) {
            if (offers[allOffers[i]].isActive && block.timestamp <= offers[allOffers[i]].offerExpiry) {
                activeOffers[index] = allOffers[i];
                index++;
            }
        }

        return activeOffers;
    }

    /**
     * @dev Update marketplace fee (only owner)
     */
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        marketplaceFee = newFee;
    }

    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}