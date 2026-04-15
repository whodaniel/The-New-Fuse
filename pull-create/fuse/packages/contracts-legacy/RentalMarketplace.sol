// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC4907.sol";

/**
 * @title RentalMarketplace
 * @dev Decentralized marketplace for renting Agent NFTs
 * 
 * Features:
 * - ERC-4907 compliant rental system
 * - Flexible pricing models (hourly, daily, weekly)
 * - Automatic rental expiration handling
 * - Escrow system for secure payments
 * - Rating and reputation system
 * - Bulk operations for efficiency
 * 
 * This contract enables an agent-as-a-service economy where agents can be
 * temporarily rented for specific tasks while maintaining ownership rights.
 */
contract RentalMarketplace is ReentrancyGuard, AccessControl, Pausable {
    
    // ============ State Variables ============
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    
    enum RentalStatus {
        Available,
        Rented,
        Expired,
        Cancelled
    }
    
    enum PricingModel {
        Hourly,
        Daily,
        Weekly,
        Fixed
    }
    
    struct RentalListing {
        address nftContract;        // Agent NFT contract
        uint256 tokenId;           // Agent NFT token ID
        address owner;             // NFT owner
        address currentRenter;     // Current renter (if any)
        uint256 pricePerUnit;      // Price per time unit in wei
        PricingModel pricingModel; // Pricing model
        uint256 minRentalDuration; // Minimum rental duration in seconds
        uint256 maxRentalDuration; // Maximum rental duration in seconds
        uint256 rentalStart;       // Current rental start time
        uint256 rentalEnd;         // Current rental end time
        RentalStatus status;       // Current status
        bool isActive;             // Whether listing is active
        uint256 totalEarnings;     // Total earnings from this listing
        uint256 totalRentals;      // Number of completed rentals
        string metadataURI;        // Additional listing metadata
    }
    
    struct RentalAgreement {
        uint256 listingId;         // Associated listing
        address renter;            // Renter address
        uint256 startTime;         // Rental start time
        uint256 endTime;           // Rental end time
        uint256 totalPrice;        // Total rental price
        uint256 deposit;           // Security deposit
        bool isActive;             // Whether rental is active
        bool depositReturned;      // Whether deposit was returned
        uint8 renterRating;        // Rating given by owner (1-5)
        uint8 ownerRating;         // Rating given by renter (1-5)
        string reviewURI;          // IPFS hash for detailed review
    }
    
    // ============ Mappings & Storage ============
    
    mapping(uint256 => RentalListing) public listings;
    mapping(uint256 => RentalAgreement) public agreements;
    mapping(address => uint256[]) public userListings; // owner => listing IDs
    mapping(address => uint256[]) public userRentals;  // renter => agreement IDs
    mapping(address => uint256) public userRatings;    // address => average rating * 100
    mapping(address => uint256) public userRatingCount; // address => number of ratings
    mapping(address => uint256) public pendingWithdrawals; // address => amount
    
    uint256 public nextListingId;
    uint256 public nextAgreementId;
    uint256 public platformFeePercentage = 250; // 2.5% in basis points
    address public feeRecipient;
    
    // Time constants
    uint256 public constant HOUR = 3600;
    uint256 public constant DAY = 86400;
    uint256 public constant WEEK = 604800;
    
    // ============ Events ============
    
    event ListingCreated(
        uint256 indexed listingId,
        address indexed owner,
        address indexed nftContract,
        uint256 tokenId,
        uint256 pricePerUnit,
        PricingModel pricingModel
    );
    
    event RentalStarted(
        uint256 indexed listingId,
        uint256 indexed agreementId,
        address indexed renter,
        uint256 startTime,
        uint256 endTime,
        uint256 totalPrice
    );
    
    event RentalEnded(
        uint256 indexed agreementId,
        address indexed renter,
        bool depositReturned
    );
    
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice,
        PricingModel newPricingModel
    );
    
    event RatingSubmitted(
        uint256 indexed agreementId,
        address indexed rater,
        address indexed ratee,
        uint8 rating
    );
    
    event WithdrawalProcessed(
        address indexed user,
        uint256 amount
    );
    
    // ============ Constructor ============
    
    constructor(
        address defaultAdmin,
        address _feeRecipient
    ) {
        require(_feeRecipient != address(0), "RentalMarketplace: Invalid fee recipient");
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ORACLE_ROLE, defaultAdmin);
        _grantRole(MANAGER_ROLE, defaultAdmin);
        
        feeRecipient = _feeRecipient;
        nextListingId = 1;
        nextAgreementId = 1;
    }
    
    // ============ Core Rental Functions ============
    
    /**
     * @dev Create a new rental listing
     * @param nftContract Agent NFT contract address
     * @param tokenId Agent NFT token ID
     * @param pricePerUnit Price per time unit
     * @param pricingModel Pricing model to use
     * @param minDuration Minimum rental duration
     * @param maxDuration Maximum rental duration
     * @param metadataURI Additional listing metadata
     * @return listingId The created listing ID
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 pricePerUnit,
        PricingModel pricingModel,
        uint256 minDuration,
        uint256 maxDuration,
        string calldata metadataURI
    ) external whenNotPaused nonReentrant returns (uint256 listingId) {
        require(nftContract != address(0), "RentalMarketplace: Invalid contract");
        require(pricePerUnit > 0, "RentalMarketplace: Invalid price");
        require(minDuration > 0, "RentalMarketplace: Invalid min duration");
        require(maxDuration >= minDuration, "RentalMarketplace: Invalid max duration");
        
        // Verify ownership
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "RentalMarketplace: Not owner");
        
        listingId = nextListingId++;
        
        listings[listingId] = RentalListing({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            currentRenter: address(0),
            pricePerUnit: pricePerUnit,
            pricingModel: pricingModel,
            minRentalDuration: minDuration,
            maxRentalDuration: maxDuration,
            rentalStart: 0,
            rentalEnd: 0,
            status: RentalStatus.Available,
            isActive: true,
            totalEarnings: 0,
            totalRentals: 0,
            metadataURI: metadataURI
        });
        
        userListings[msg.sender].push(listingId);
        
        emit ListingCreated(
            listingId,
            msg.sender,
            nftContract,
            tokenId,
            pricePerUnit,
            pricingModel
        );
        
        return listingId;
    }
    
    /**
     * @dev Rent an agent for a specified duration
     * @param listingId The listing to rent from
     * @param duration Rental duration in seconds
     * @return agreementId The created rental agreement ID
     */
    function rentAgent(
        uint256 listingId,
        uint256 duration
    ) external payable whenNotPaused nonReentrant returns (uint256 agreementId) {
        RentalListing storage listing = listings[listingId];
        require(listing.isActive, "RentalMarketplace: Listing not active");
        require(listing.status == RentalStatus.Available, "RentalMarketplace: Not available");
        require(duration >= listing.minRentalDuration, "RentalMarketplace: Duration too short");
        require(duration <= listing.maxRentalDuration, "RentalMarketplace: Duration too long");
        require(msg.sender != listing.owner, "RentalMarketplace: Cannot rent own agent");
        
        uint256 totalPrice = _calculatePrice(listing.pricePerUnit, listing.pricingModel, duration);
        uint256 deposit = totalPrice / 10; // 10% deposit
        uint256 totalRequired = totalPrice + deposit;
        
        require(msg.value >= totalRequired, "RentalMarketplace: Insufficient payment");
        
        // Create rental agreement
        agreementId = nextAgreementId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        agreements[agreementId] = RentalAgreement({
            listingId: listingId,
            renter: msg.sender,
            startTime: startTime,
            endTime: endTime,
            totalPrice: totalPrice,
            deposit: deposit,
            isActive: true,
            depositReturned: false,
            renterRating: 0,
            ownerRating: 0,
            reviewURI: ""
        });
        
        // Update listing
        listing.currentRenter = msg.sender;
        listing.rentalStart = startTime;
        listing.rentalEnd = endTime;
        listing.status = RentalStatus.Rented;
        listing.totalRentals++;
        
        // Set user in ERC4907 contract if supported
        if (_supportsERC4907(listing.nftContract)) {
            try IERC4907(listing.nftContract).setUser(listing.tokenId, msg.sender, uint64(endTime)) {
                // Successfully set user
            } catch {
                // Contract doesn't support ERC4907 or call failed
            }
        }
        
        userRentals[msg.sender].push(agreementId);
        
        // Handle payments
        uint256 platformFee = (totalPrice * platformFeePercentage) / 10000;
        uint256 ownerPayment = totalPrice - platformFee;
        
        pendingWithdrawals[listing.owner] += ownerPayment;
        pendingWithdrawals[feeRecipient] += platformFee;
        
        // Refund excess payment
        if (msg.value > totalRequired) {
            payable(msg.sender).transfer(msg.value - totalRequired);
        }
        
        emit RentalStarted(listingId, agreementId, msg.sender, startTime, endTime, totalPrice);
        
        return agreementId;
    }
    
    /**
     * @dev End a rental (can be called by anyone after expiration)
     * @param agreementId The rental agreement to end
     * @param returnDeposit Whether to return the deposit
     */
    function endRental(
        uint256 agreementId,
        bool returnDeposit
    ) external whenNotPaused nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        require(agreement.isActive, "RentalMarketplace: Rental not active");
        
        RentalListing storage listing = listings[agreement.listingId];
        
        // Check if rental has expired or if owner/renter is calling
        bool canEnd = block.timestamp >= agreement.endTime ||
                     msg.sender == listing.owner ||
                     msg.sender == agreement.renter;
        require(canEnd, "RentalMarketplace: Cannot end rental yet");
        
        // Only owner can decide on deposit return before expiration
        if (block.timestamp < agreement.endTime) {
            require(msg.sender == listing.owner, "RentalMarketplace: Only owner can end early");
        } else {
            // Auto-return deposit after expiration if not specified
            returnDeposit = true;
        }
        
        // Update states
        agreement.isActive = false;
        agreement.depositReturned = returnDeposit;
        
        listing.currentRenter = address(0);
        listing.rentalStart = 0;
        listing.rentalEnd = 0;
        listing.status = RentalStatus.Available;
        
        // Handle deposit
        if (returnDeposit) {
            pendingWithdrawals[agreement.renter] += agreement.deposit;
        } else {
            // Deposit goes to owner as penalty
            pendingWithdrawals[listing.owner] += agreement.deposit;
        }
        
        // Clear ERC4907 user if supported
        if (_supportsERC4907(listing.nftContract)) {
            try IERC4907(listing.nftContract).setUser(listing.tokenId, address(0), 0) {
                // Successfully cleared user
            } catch {
                // Contract doesn't support ERC4907 or call failed
            }
        }
        
        emit RentalEnded(agreementId, agreement.renter, returnDeposit);
    }
    
    /**
     * @dev Submit a rating for a completed rental
     * @param agreementId The rental agreement ID
     * @param rating Rating from 1-5
     * @param reviewURI IPFS hash for detailed review
     */
    function submitRating(
        uint256 agreementId,
        uint8 rating,
        string calldata reviewURI
    ) external whenNotPaused {
        require(rating >= 1 && rating <= 5, "RentalMarketplace: Invalid rating");
        
        RentalAgreement storage agreement = agreements[agreementId];
        require(!agreement.isActive, "RentalMarketplace: Rental still active");
        
        RentalListing storage listing = listings[agreement.listingId];
        
        address ratee;
        
        if (msg.sender == agreement.renter) {
            require(agreement.ownerRating == 0, "RentalMarketplace: Already rated");
            agreement.ownerRating = rating;
            agreement.reviewURI = reviewURI;
            ratee = listing.owner;
        } else if (msg.sender == listing.owner) {
            require(agreement.renterRating == 0, "RentalMarketplace: Already rated");
            agreement.renterRating = rating;
            ratee = agreement.renter;
        } else {
            revert("RentalMarketplace: Not authorized to rate");
        }
        
        // Update user's average rating
        _updateUserRating(ratee, rating);
        
        emit RatingSubmitted(agreementId, msg.sender, ratee, rating);
    }
    
    /**
     * @dev Withdraw pending payments
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "RentalMarketplace: No pending withdrawals");
        
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit WithdrawalProcessed(msg.sender, amount);
    }
    
    /**
     * @dev Update listing parameters
     * @param listingId The listing to update
     * @param newPrice New price per unit
     * @param newPricingModel New pricing model
     */
    function updateListing(
        uint256 listingId,
        uint256 newPrice,
        PricingModel newPricingModel
    ) external whenNotPaused {
        RentalListing storage listing = listings[listingId];
        require(listing.owner == msg.sender, "RentalMarketplace: Not owner");
        require(listing.status == RentalStatus.Available, "RentalMarketplace: Currently rented");
        require(newPrice > 0, "RentalMarketplace: Invalid price");
        
        listing.pricePerUnit = newPrice;
        listing.pricingModel = newPricingModel;
        
        emit ListingUpdated(listingId, newPrice, newPricingModel);
    }
    
    /**
     * @dev Cancel a listing
     * @param listingId The listing to cancel
     */
    function cancelListing(uint256 listingId) external whenNotPaused {
        RentalListing storage listing = listings[listingId];
        require(listing.owner == msg.sender, "RentalMarketplace: Not owner");
        require(listing.status == RentalStatus.Available, "RentalMarketplace: Currently rented");
        
        listing.isActive = false;
        listing.status = RentalStatus.Cancelled;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get listing information
     * @param listingId The listing ID
     * @return listing The listing data
     */
    function getListing(uint256 listingId) 
        external 
        view 
        returns (RentalListing memory listing) 
    {
        return listings[listingId];
    }
    
    /**
     * @dev Get rental agreement information
     * @param agreementId The agreement ID
     * @return agreement The agreement data
     */
    function getAgreement(uint256 agreementId) 
        external 
        view 
        returns (RentalAgreement memory agreement) 
    {
        return agreements[agreementId];
    }
    
    /**
     * @dev Calculate rental price for given parameters
     * @param pricePerUnit Base price per unit
     * @param pricingModel Pricing model
     * @param duration Duration in seconds
     * @return totalPrice The calculated total price
     */
    function calculatePrice(
        uint256 pricePerUnit,
        PricingModel pricingModel,
        uint256 duration
    ) external pure returns (uint256 totalPrice) {
        return _calculatePrice(pricePerUnit, pricingModel, duration);
    }
    
    /**
     * @dev Get user's listings
     * @param user The user address
     * @return listingIds Array of listing IDs
     */
    function getUserListings(address user) 
        external 
        view 
        returns (uint256[] memory listingIds) 
    {
        return userListings[user];
    }
    
    /**
     * @dev Get user's rentals
     * @param user The user address
     * @return agreementIds Array of agreement IDs
     */
    function getUserRentals(address user) 
        external 
        view 
        returns (uint256[] memory agreementIds) 
    {
        return userRentals[user];
    }
    
    /**
     * @dev Get user's rating information
     * @param user The user address
     * @return averageRating Average rating (scaled by 100)
     * @return ratingCount Number of ratings received
     */
    function getUserRating(address user) 
        external 
        view 
        returns (uint256 averageRating, uint256 ratingCount) 
    {
        return (userRatings[user], userRatingCount[user]);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update platform fee percentage
     * @param newFeePercentage New fee percentage in basis points
     */
    function updatePlatformFee(uint256 newFeePercentage) 
        external 
        onlyRole(MANAGER_ROLE) 
    {
        require(newFeePercentage <= 1000, "RentalMarketplace: Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }
    
    /**
     * @dev Update fee recipient
     * @param newFeeRecipient New fee recipient address
     */
    function updateFeeRecipient(address newFeeRecipient) 
        external 
        onlyRole(MANAGER_ROLE) 
    {
        require(newFeeRecipient != address(0), "RentalMarketplace: Invalid recipient");
        feeRecipient = newFeeRecipient;
    }
    
    /**
     * @dev Emergency pause functionality
     */
    function pause() external onlyRole(MANAGER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(MANAGER_ROLE) {
        _unpause();
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Calculate price based on pricing model and duration
     */
    function _calculatePrice(
        uint256 pricePerUnit,
        PricingModel pricingModel,
        uint256 duration
    ) internal pure returns (uint256) {
        if (pricingModel == PricingModel.Fixed) {
            return pricePerUnit;
        } else if (pricingModel == PricingModel.Hourly) {
            return (pricePerUnit * duration) / HOUR;
        } else if (pricingModel == PricingModel.Daily) {
            return (pricePerUnit * duration) / DAY;
        } else if (pricingModel == PricingModel.Weekly) {
            return (pricePerUnit * duration) / WEEK;
        }
        return 0;
    }
    
    /**
     * @dev Update user's average rating
     */
    function _updateUserRating(address user, uint8 newRating) internal {
        uint256 currentAverage = userRatings[user];
        uint256 currentCount = userRatingCount[user];
        
        uint256 newAverage = ((currentAverage * currentCount) + (newRating * 100)) / (currentCount + 1);
        
        userRatings[user] = newAverage;
        userRatingCount[user] = currentCount + 1;
    }
    
    /**
     * @dev Check if contract supports ERC4907
     */
    function _supportsERC4907(address nftContract) internal view returns (bool) {
        try IERC165(nftContract).supportsInterface(0xad092b5c) returns (bool supported) {
            return supported;
        } catch {
            return false;
        }
    }
}