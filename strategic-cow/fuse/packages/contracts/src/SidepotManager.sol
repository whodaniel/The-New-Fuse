// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SidepotManager
 * @notice Parallel game-layer sidepot ledger with weighted-loss accounting.
 * @dev This contract does not replace PoolTogether core prize logic. It holds and
 *      redistributes routed funds from wrappers/hooks.
 */
contract SidepotManager is Ownable, ReentrancyGuard {
    IERC20 public immutable paymentToken;
    address public router;

    struct Pot {
        string label;
        uint256 balance;
        uint256 minDrawAmount;
        uint256 totalFunded;
        bool active;
    }

    uint256 public potCount;
    mapping(uint256 => Pot) public pots;
    mapping(uint256 => mapping(address => uint256)) public weightedLossUnits;
    mapping(address => bool) public lossReporters;

    event RouterUpdated(address indexed router);
    event LossReporterUpdated(address indexed reporter, bool allowed);
    event PotCreated(uint256 indexed potId, string label, uint256 minDrawAmount);
    event PotFunded(uint256 indexed potId, address indexed funder, uint256 amount);
    event LossReported(uint256 indexed potId, address indexed account, uint256 lossUnits);
    event PotDrawn(uint256 indexed potId, address indexed winner, uint256 amount);
    event PotSiphoned(uint256 indexed fromPotId, uint256 indexed toPotId, uint256 amount);

    error InvalidPot();
    error InactivePot();
    error NotRouter();
    error NotLossReporter();
    error InvalidAmount();
    error DrawBelowMinimum();

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    modifier onlyRouter() {
        if (msg.sender != router) revert NotRouter();
        _;
    }

    function setRouter(address _router) external onlyOwner {
        router = _router;
        emit RouterUpdated(_router);
    }

    function setLossReporter(address reporter, bool allowed) external onlyOwner {
        lossReporters[reporter] = allowed;
        emit LossReporterUpdated(reporter, allowed);
    }

    function createPot(string calldata label, uint256 minDrawAmount) external onlyOwner returns (uint256 potId) {
        potId = ++potCount;
        pots[potId] = Pot({
            label: label,
            balance: 0,
            minDrawAmount: minDrawAmount,
            totalFunded: 0,
            active: true
        });
        emit PotCreated(potId, label, minDrawAmount);
    }

    function setPotActive(uint256 potId, bool active) external onlyOwner {
        _requirePotExists(potId);
        pots[potId].active = active;
    }

    function fundPot(uint256 potId, uint256 amount) external nonReentrant {
        _fundPot(potId, amount, msg.sender);
    }

    /**
     * @notice Router-funded pathway for claim-hook routing.
     * @dev Router must have approved SidepotManager beforehand.
     */
    function fundPotFromRouter(uint256 potId, uint256 amount) external onlyRouter nonReentrant {
        _fundPot(potId, amount, msg.sender);
    }

    function reportLoss(uint256 potId, address account, uint256 lossUnits) external {
        if (!lossReporters[msg.sender]) revert NotLossReporter();
        _requirePotExists(potId);
        if (!pots[potId].active) revert InactivePot();
        if (lossUnits == 0) revert InvalidAmount();
        weightedLossUnits[potId][account] += lossUnits;
        emit LossReported(potId, account, lossUnits);
    }

    /**
     * @notice Owner-controlled payout. Expected to be called by off-chain draw logic.
     * @param payoutBps fraction of current pot balance paid out to winner.
     */
    function drawPotToWinner(uint256 potId, address winner, uint16 payoutBps) external onlyOwner nonReentrant returns (uint256 payout) {
        _requirePotExists(potId);
        if (!pots[potId].active) revert InactivePot();
        if (payoutBps == 0 || payoutBps > 10_000) revert InvalidAmount();

        payout = (pots[potId].balance * payoutBps) / 10_000;
        if (payout < pots[potId].minDrawAmount) revert DrawBelowMinimum();

        pots[potId].balance -= payout;
        paymentToken.transfer(winner, payout);
        emit PotDrawn(potId, winner, payout);
    }

    function siphon(uint256 fromPotId, uint256 toPotId, uint256 amount) external onlyOwner {
        _requirePotExists(fromPotId);
        _requirePotExists(toPotId);
        if (amount == 0 || amount > pots[fromPotId].balance) revert InvalidAmount();

        pots[fromPotId].balance -= amount;
        pots[toPotId].balance += amount;
        emit PotSiphoned(fromPotId, toPotId, amount);
    }

    function _fundPot(uint256 potId, uint256 amount, address funder) internal {
        _requirePotExists(potId);
        if (!pots[potId].active) revert InactivePot();
        if (amount == 0) revert InvalidAmount();

        paymentToken.transferFrom(funder, address(this), amount);
        pots[potId].balance += amount;
        pots[potId].totalFunded += amount;
        emit PotFunded(potId, funder, amount);
    }

    function _requirePotExists(uint256 potId) internal view {
        if (potId == 0 || potId > potCount) revert InvalidPot();
    }
}
