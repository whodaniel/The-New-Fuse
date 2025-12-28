// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FuseBadges is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) public badgeTypes;

    constructor() ERC721("Fuse Badge", "FUSE-SBT") Ownable(msg.sender) {}

    function awardBadge(address to, string memory badgeType) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        badgeTypes[tokenId] = badgeType;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert("Soulbound");
        return super._update(to, tokenId, auth);
    }
}
