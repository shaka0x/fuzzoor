export const content =
`// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {Handlers} from "./Handlers.sol";

/// @notice Contract to be used for quick testing with Foundry
contract FoundryTester is Test, Handlers {
    uint256 private actorIndex = 0;

    modifier useActor() override {
        actor = actors[actorIndex];
        _;
    }

    function setUp() public {
        setup();
        setupActors();
    }

    function test_foo() public {
        // TODO: implement test for quick checks
    }
}`;