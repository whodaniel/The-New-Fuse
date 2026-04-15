// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MerkabaCore
 * @author AI Arcade Systems
 * @notice The "Gyroscope" that balances Active Liquidity (Sun) vs. Passive Yield (Earth).
 * @dev This contract holds the funds and rebalances them based on the Golden Ratio.
 */
contract MerkabaCore is Ownable, ReentrancyGuard {

    // --- The Sacred Geometry ---
    IERC20 public immutable paymentToken; // The blood of the system (USDC/ETH)

    // The Two Pyramids
    uint256 public sunBalance;   // Active Prize Pools (Hot Liquidity)
    uint256 public earthBalance; // Treasury / Yield Strategies (Cold Storage)

    // The Golden Ratio Config
    uint256 public targetRatio = 100; // 1.00 (1:1 Ratio)
    uint256 public rebalanceStrength = 5; // Move 5% of excess per pulse
    uint256 public constant PRECISION = 100;

    // --- Events (The Heartbeat) ---
    event Deposit(string source, uint256 amount, uint256 splitSun, uint256 splitEarth);
    event Pulse(string action, uint256 amountMoved, uint256 newSun, uint256 newEarth);
    event EmergencyDrain(address target, uint256 amount);

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    // --- 1. The Injection (Money Enters) ---
    /**
     * @notice The Auction Engine sends fees here.
     * @dev Automatically splits the incoming energy based on the Merkaba Logic.
     * Standard Split: 80% Sun (Prizes), 20% Earth (Savings).
     */
    function injectCapital(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero energy");

        // Transfer funds from the sender (Auction Engine) to here
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // The "Default" Split (Can be adjusted via Governance)
        uint256 toSun = (_amount * 80) / 100;
        uint256 toEarth = _amount - toSun;

        sunBalance += toSun;
        earthBalance += toEarth;

        emit Deposit("AuctionFee", _amount, toSun, toEarth);

        // OPTIONAL: Trigger a pulse immediately to check balance
        _pulse();
    }

    // --- 2. The Gyroscope (The Logic) ---
    /**
     * @notice The "Heartbeat" function. Anyone can call it (or a Keeper bot).
     * @dev Checks the ratio between Sun and Earth. Moves funds to restore balance.
     */
    function pulse() external nonReentrant {
        _pulse();
    }

    function _pulse() internal {
        // Safety: Prevent division by zero
        if (earthBalance == 0 || sunBalance == 0) return;

        // Calculate Current Ratio (Sun / Earth)
        // Scaled by 100 for integer math. Example: 120 = 1.2 Ratio
        uint256 currentRatio = (sunBalance * PRECISION) / earthBalance;

        if (currentRatio > targetRatio) {
            // SCENARIO A: SUN IS TOO HOT (Ratio > 1.0)
            // The Arcade is generating too much cash/prizes, but has low backing.
            // ACTION: Siphon excess Heat to Earth (Cooling).

            uint256 excess = sunBalance - earthBalance; // Simplified delta
            uint256 moveAmount = (excess * rebalanceStrength) / 100;

            sunBalance -= moveAmount;
            earthBalance += moveAmount;

            emit Pulse("COOLING: Sun -> Earth", moveAmount, sunBalance, earthBalance);

        } else if (currentRatio < targetRatio) {
            // SCENARIO B: EARTH IS TOO HEAVY (Ratio < 1.0)
            // The Treasury is huge, but the daily prizes are small/boring.
            // ACTION: Pump Gravity into Sun (Heating).

            uint256 shortage = earthBalance - sunBalance; // Simplified delta
            uint256 moveAmount = (shortage * rebalanceStrength) / 100;

            earthBalance -= moveAmount;
            sunBalance += moveAmount;

            emit Pulse("HEATING: Earth -> Sun", moveAmount, sunBalance, earthBalance);
        }
    }

    // --- 3. The Hydraulics (Money Exits) ---
    /**
     * @notice Allows the Auction Engine to pull funds for a Jackpot Winner.
     * @dev Only the "Sun" balance can be touched for prizes.
     */
    function payoutWinner(address _winner, uint256 _amount) external onlyOwner nonReentrant {
        require(_amount <= sunBalance, "Not enough Sun energy");

        sunBalance -= _amount;
        require(paymentToken.transfer(_winner, _amount), "Payout failed");
    }

    /**
     * @notice Allows the Treasury Manager to invest Earth funds into Yield Protocols (Aave/Compound).
     * @dev Funds leave this contract but are tracked as "Earth Balance" via the receipt token.
     */
    function investEarth(address _yieldStrategy, uint256 _amount) external onlyOwner {
        require(_amount <= earthBalance, "Not enough Earth energy");
        // Integration with Aave/Compound would go here
        // For MVP, we just allow the owner to move it to a multisig
        require(paymentToken.transfer(_yieldStrategy, _amount), "Invest failed");
        // Note: We do NOT decrease earthBalance here if we expect the yield strategy
        // to return the funds later. We treat it as "Deployed Capital".
    }
}
