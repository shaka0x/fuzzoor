export const template =
`// SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.2 <0.9.0;

import "./BaseProxy.sol";
import {Target} from "filePath";

contract ContractProxy is BaseProxy {
    Target private target;
    // TODO: add expected errors for each function
    // expectedErrors

    constructor(Target _target) {
        target = _target;
    }
    // functions
}`;