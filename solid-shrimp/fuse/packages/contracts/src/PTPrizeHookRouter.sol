// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISidepotManager {
    function fundPotFromRouter(uint256 potId, uint256 amount) external;
}

/**
 * @dev PoolTogether V5 prize hook interface.
 * Ref: https://dev.pooltogether.com/protocol/guides/customize/prize-hooks/
 */
interface IPrizeHooks {
    function beforeClaimPrize(
        address winner,
        uint8 tier,
        uint32 prizeIndex,
        uint96 reward,
        address rewardRecipient
    ) external returns (address prizeRecipient, bytes memory data);

    function afterClaimPrize(
        address winner,
        uint8 tier,
        uint32 prizeIndex,
        uint256 prizeAmount,
        address prizeRecipient,
        bytes calldata data
    ) external;
}

/**
 * @title PTPrizeHookRouter
 * @notice Hook-compatible router that splits claimed prize amounts between:
 * winner, treasury, and sidepot manager.
 */
contract PTPrizeHookRouter is Ownable, ReentrancyGuard, IPrizeHooks {
    IERC20 public immutable prizeToken;
    ISidepotManager public sidepotManager;
    address public prizeVault;
    address public treasury;
    uint256 public sidepotId;

    uint16 public sidepotBps;
    uint16 public treasuryBps;

    event PrizeVaultUpdated(address indexed prizeVault);
    event TreasuryUpdated(address indexed treasury);
    event SidepotManagerUpdated(address indexed sidepotManager);
    event SplitConfigUpdated(uint16 sidepotBps, uint16 treasuryBps);
    event SidepotIdUpdated(uint256 sidepotId);
    event PrizeRouted(
        address indexed winner,
        uint256 prizeAmount,
        uint256 winnerAmount,
        uint256 treasuryAmount,
        uint256 sidepotAmount
    );

    error NotPrizeVault();
    error InvalidSplit();
    error InvalidAddress();

    constructor(
        address _prizeToken,
        address _sidepotManager,
        address _prizeVault,
        address _treasury,
        uint256 _sidepotId,
        uint16 _sidepotBps,
        uint16 _treasuryBps
    ) Ownable(msg.sender) {
        if (_prizeToken == address(0) || _sidepotManager == address(0) || _treasury == address(0)) {
            revert InvalidAddress();
        }
        if (_sidepotBps + _treasuryBps > 10_000) revert InvalidSplit();
        prizeToken = IERC20(_prizeToken);
        sidepotManager = ISidepotManager(_sidepotManager);
        prizeVault = _prizeVault;
        treasury = _treasury;
        sidepotId = _sidepotId;
        sidepotBps = _sidepotBps;
        treasuryBps = _treasuryBps;
    }

    modifier onlyPrizeVault() {
        if (msg.sender != prizeVault) revert NotPrizeVault();
        _;
    }

    function setPrizeVault(address _prizeVault) external onlyOwner {
        prizeVault = _prizeVault;
        emit PrizeVaultUpdated(_prizeVault);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setSidepotManager(address _sidepotManager) external onlyOwner {
        if (_sidepotManager == address(0)) revert InvalidAddress();
        sidepotManager = ISidepotManager(_sidepotManager);
        emit SidepotManagerUpdated(_sidepotManager);
    }

    function setSidepotId(uint256 _sidepotId) external onlyOwner {
        sidepotId = _sidepotId;
        emit SidepotIdUpdated(_sidepotId);
    }

    function setSplitConfig(uint16 _sidepotBps, uint16 _treasuryBps) external onlyOwner {
        if (_sidepotBps + _treasuryBps > 10_000) revert InvalidSplit();
        sidepotBps = _sidepotBps;
        treasuryBps = _treasuryBps;
        emit SplitConfigUpdated(_sidepotBps, _treasuryBps);
    }

    /**
     * @dev PrizePool should transfer prize to returned recipient.
     * We return this contract so it can split payout deterministically in afterClaimPrize.
     */
    function beforeClaimPrize(
        address winner,
        uint8, /* tier */
        uint32, /* prizeIndex */
        uint96, /* reward */
        address /* rewardRecipient */
    ) external view override onlyPrizeVault returns (address prizeRecipient, bytes memory data) {
        prizeRecipient = address(this);
        data = abi.encode(winner);
    }

    function afterClaimPrize(
        address, /* winner */
        uint8, /* tier */
        uint32, /* prizeIndex */
        uint256 prizeAmount,
        address, /* prizeRecipient */
        bytes calldata data
    ) external override onlyPrizeVault nonReentrant {
        address winner = abi.decode(data, (address));
        uint256 sidepotAmount = (prizeAmount * sidepotBps) / 10_000;
        uint256 treasuryAmount = (prizeAmount * treasuryBps) / 10_000;
        uint256 winnerAmount = prizeAmount - sidepotAmount - treasuryAmount;

        if (sidepotAmount > 0) {
            prizeToken.approve(address(sidepotManager), sidepotAmount);
            sidepotManager.fundPotFromRouter(sidepotId, sidepotAmount);
        }
        if (treasuryAmount > 0) {
            prizeToken.transfer(treasury, treasuryAmount);
        }
        if (winnerAmount > 0) {
            prizeToken.transfer(winner, winnerAmount);
        }

        emit PrizeRouted(winner, prizeAmount, winnerAmount, treasuryAmount, sidepotAmount);
    }
}
