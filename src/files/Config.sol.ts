export const content =
`// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

/// @notice Configuration constants
abstract contract Config {
    address internal constant USER1 = address(0x10000);
    address internal constant USER2 = address(0x20000);
    address internal constant USER3 = address(0x30000);

    address[] internal ORIGIN_ACCOUNTS = [USER1, USER2, USER3];
    string[] internal ACTOR_LABELS = ["Alice", "Bob", "Charlie"];

    uint256 internal constant INITIAL_ETH_BALANCE = 1_000 ether;
    uint256 internal constant INITIAL_TOKEN_BALANCE = 10_000;
}`;