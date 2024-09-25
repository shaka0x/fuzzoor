export const content =
`// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Base} from "./Base.sol";
import {Snapshots} from "./Snapshots.sol";
import {PropertiesAsserts} from "./utils/PropertiesHelper.sol";

/// @notice Contains the functions that check the properties (invariants)
abstract contract Properties is Base, Snapshots, PropertiesAsserts {

    // ―――――――――――――――――――― Global properties ―――――――――――――――――――――

    modifier globalProperties() {
        _;
        // property_balanceIsZero();
    }

    // TODO: Define properties and add to globalProperties modifier
    // e.g.:
    // function property_balanceIsZero() internal {
    //     eq(actor.balance(), 0, "Balance is zero");
    // }

    // ――――――――――――――――――― Specific properties ――――――――――――――――――――

    // TODO: Define properties and add to the corresponding handler function
    // e.g.:
    // function property_balanceGreaterThanOne() internal {
    //     gt(actor.balance(), 1, "Balance greater than one");
    // }
}`;
