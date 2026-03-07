// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for the Merkaba Treasury
interface IMerkabaCore {
    function injectCapital(uint256 amount) external;
}

// Interface for Genesis Node
interface IGenesisNode {
    function depositSunRewards(uint256 amount) external;
}

/**
 * @title ArcadeAuctionEngine
 * @author AI Arcade Systems (The New Fuse)
 * @notice The "Machine" on the Arcade floor. Handles bids, price drops, and item delivery.
 * @dev Integrates with MerkabaCore for liquidity recycling.
 */
contract AuctionEngine is Ownable, ReentrancyGuard {

    // --- Configuration ---
    IERC20 public arcadeToken;      // The "Quarter" (ERC-20 Token)
    IMerkabaCore public merkabaCore; // The Treasury (The Battery)
    IGenesisNode public genesisNode; // The Equity (The Keys)

    // --- The "Arcade Cabinet" Data ---
    struct Auction {
        uint256 id;
        string agentId;      // e.g., "DeepSeek-R1-Lifetime" or "TNF-Director-001"
        uint256 currentPrice;// The "Buy Now" Price
        uint256 floorPrice;  // The absolute minimum (Reserve)
        uint256 priceDrop;   // How much price drops per BID
        uint256 bidFee;      // Cost to play (insert coin)
        bool active;
        address winner;
        address lastBidder;  // For "Sniper" mechanics
        uint256 endTime;     // Optional: For "Candle" auctions
    }

    uint256 public auctionCount;
    mapping(uint256 => Auction) public auctions;

    // --- RPG Stats (Loss Mining) ---
    // We track "Volume" to sync with the Frontend Leaderboard
    mapping(address => uint256) public userVolume;

    // --- Events (Websocket Hooks) ---
    // The frontend listens to these to update the UI in real-time
    event CabinetCreated(uint256 indexed id, string agentId, uint256 startPrice);
    event CoinInserted(uint256 indexed id, address indexed player, uint256 newPrice, uint256 treasuryInjection);
    event JackpotUnlock(uint256 indexed id, address indexed winner, uint256 finalCost);

    constructor(address _token, address _merkaba, address _genesis) Ownable(msg.sender) {
        arcadeToken = IERC20(_token);
        merkabaCore = IMerkabaCore(_merkaba);
        genesisNode = IGenesisNode(_genesis);
    }

    // --- Admin: Install New Machine ---
    function createCabinet(
        string memory _agentId,
        uint256 _startPrice,
        uint256 _floorPrice,
        uint256 _priceDrop,
        uint256 _bidFee
    ) external onlyOwner {
        auctionCount++;
        auctions[auctionCount] = Auction({
            id: auctionCount,
            agentId: _agentId,
            currentPrice: _startPrice,
            floorPrice: _floorPrice,
            priceDrop: _priceDrop,
            bidFee: _bidFee,
            active: true,
            winner: address(0),
            lastBidder: address(0),
            endTime: block.timestamp + 7 days // Default timeout
        });

        emit CabinetCreated(auctionCount, _agentId, _startPrice);
    }

    // --- Player: Insert Coin (The Bid) ---
    /**
     * @notice The Core Loop. User pays a small fee to drop the price for everyone.
     * @dev Fee is split: Part to Seller (Burn), Part to Merkaba (Treasury).
     */
    function insertCoin(uint256 _auctionId) external nonReentrant {
        Auction storage machine = auctions[_auctionId];
        require(machine.active, "Game Over");
        require(block.timestamp < machine.endTime, "Time expired");
        require(machine.currentPrice > machine.floorPrice, "Floor hit");

        // 1. Take Payment (The Fee)
        require(arcadeToken.transferFrom(msg.sender, address(this), machine.bidFee), "Insert Coin Failed");

        // 2. The Hydraulic Split
        // Fee: $1.00
        // $0.50 -> Revenue (Burn/House - Stays in Contract)
        // $0.40 -> Merkaba (Prizes)
        // $0.10 -> Genesis Nodes (Dividends)

        uint256 fee = machine.bidFee;
        uint256 toGenesis = (fee * 10) / 100; // 10%
        uint256 toTreasury = (fee * 40) / 100; // 40%
        // Remainder (50%) stays in contract

        // Transfer to Genesis
        arcadeToken.approve(address(genesisNode), toGenesis);
        genesisNode.depositSunRewards(toGenesis);

        // Transfer to Treasury
        arcadeToken.approve(address(merkabaCore), toTreasury);
        merkabaCore.injectCapital(toTreasury);

        // 3. Game Logic: Drop the Price
        if (machine.currentPrice >= machine.priceDrop) {
            machine.currentPrice -= machine.priceDrop;
        } else {
            machine.currentPrice = machine.floorPrice;
        }

        // 4. Update Stats (The Sniper)
        machine.lastBidder = msg.sender;
        userVolume[msg.sender] += machine.bidFee; // Add XP for Leaderboard

        emit CoinInserted(_auctionId, msg.sender, machine.currentPrice, toTreasury);
    }

    // --- Player: Buy Now (Win the Prize) ---
    /**
     * @notice User pays the CURRENT discounted price to win the Item.
     * @dev This triggers the Web2 Backend to unlock the Agent.
     */
    function unlockAgent(uint256 _auctionId) external nonReentrant {
        Auction storage machine = auctions[_auctionId];
        require(machine.active, "Game Over");

        // 1. Take Payment (The Price)
        require(arcadeToken.transferFrom(msg.sender, address(this), machine.currentPrice), "Insufficient Funds");

        // 2. Finalize Game
        machine.active = false;
        machine.winner = msg.sender;

        // 3. Loot Distribution
        // Revenue stays here (House) or moves to a Vault.
        // For MVP, we leave it in contract.

        emit JackpotUnlock(_auctionId, msg.sender, machine.currentPrice);
    }
}
