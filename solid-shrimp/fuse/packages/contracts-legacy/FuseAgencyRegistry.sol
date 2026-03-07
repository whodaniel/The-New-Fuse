// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FuseAgencyRegistry is ERC721, Ownable {
    struct AgencyLicense {
        uint256 id;
        address owner;
        string agencyName;
        uint256 expiration;
    }
    mapping(uint256 => AgencyLicense) public licenses;

    constructor() ERC721("Fuse Agency Hub", "FUSE-HUB") Ownable(msg.sender) {}

    function mintAgencyLicense(string memory _name, uint256 _duration) external payable {
        // Payment logic for license fee would go here
        uint256 licenseId = uint256(keccak256(abi.encodePacked(_name, msg.sender)));
        _safeMint(msg.sender, licenseId);
        licenses[licenseId] = AgencyLicense({
            id: licenseId,
            owner: msg.sender,
            agencyName: _name,
            expiration: block.timestamp + _duration
        });
    }

    function isSovereign(uint256 _licenseId) public view returns (bool) {
        return licenses[_licenseId].owner != address(0);
    }
}
