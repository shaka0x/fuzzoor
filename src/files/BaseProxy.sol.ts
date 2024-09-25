export const content =
`// SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.2 <0.9.0;

import {vm} from "../utils/Hevm.sol";
import {PropertiesAsserts} from "../utils/PropertiesHelper.sol";

abstract contract BaseProxy is PropertiesAsserts {

	enum RevertType {
		Error,
		Panic,
		LowLevelData
	}

	function handleError(string memory reason, string[] memory expectedErrors) internal {
		bool expected = false;
		for (uint256 i = 0; i < expectedErrors.length; i++) {
			if (keccak256(abi.encodePacked(expectedErrors[i])) == keccak256(abi.encodePacked(reason))) {
				expected = true;
				break;
			}
		}
		t(expected, string(abi.encodePacked("Unexpected error: ", reason)));
	}

	function handlePanic(uint256 errorCode) internal {
		t(false, string(abi.encodePacked("Panic: ", errorCode)));
	}

	function handleLowLevel(bytes memory data) internal {
		t(false, string(abi.encodePacked("Low level data: ", data)));
	}
}`;