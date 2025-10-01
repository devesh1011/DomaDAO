// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockFractionToken
 * @notice Mock Fraction Token (simulates Doma Fractionalization output)
 */
contract MockFractionToken is ERC20 {
    address public immutable poolAddress;

    constructor(
        string memory name,
        string memory symbol,
        address _poolAddress,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        poolAddress = _poolAddress;
        _mint(_poolAddress, totalSupply);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
