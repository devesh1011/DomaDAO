// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockDomainNFT
 * @notice Mock Domain NFT for testing purposes
 */
contract MockDomainNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("Mock Domain", "DOMAIN") Ownable(msg.sender) {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }

    function mintTo(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }
}
