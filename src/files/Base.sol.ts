export const content =
`// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Config} from "./Config.sol";
import {Actor} from "./Actor.sol";
import {vm} from "./utils/Hevm.sol";
import {Logger} from "./utils/Logger.sol";
import {Deployer} from "./utils/Deployer.sol";
import {DecimalPrinter} from "./utils/DecimalPrinter.sol";

/// @notice Base contract with state variables and setup functions
abstract contract Base is Config, Deployer {
    using DecimalPrinter for uint256;

    // ―――――――――――――――――――――――――― Ghosts ――――――――――――――――――――――――――

    struct Ghosts {
        uint256 foo; // TODO: Add ghost state variables, if needed
    }

    Ghosts internal ghosts;
    
    // ―――――――――――――――――――――――――― Actors ――――――――――――――――――――――――――
    
    mapping(address => Actor) internal originAccountToActor;
    Actor[] internal actors;
    Actor internal actor;
    
    modifier useActor() virtual {
        actor = originAccountToActor[msg.sender];
        _;
    }

    // ―――――――――――――――――――――――― Contracts ―――――――――――――――――――――――――


    // ―――――――――――――――――――――――――― Setup ―――――――――――――――――――――――――――

    function setup() internal {
    }

    function setupActors() internal {
		for (uint256 i; i < ORIGIN_ACCOUNTS.length; i++) {
			Actor _actor = new Actor{value: INITIAL_ETH_BALANCE}();
            assert(_actor.balance() == INITIAL_ETH_BALANCE);
            originAccountToActor[ORIGIN_ACCOUNTS[i]] = _actor;
            actors.push(_actor);
            if (ACTOR_LABELS.length > i) {
                // label cheatcode not supported by Medusa
                try vm.label(address(_actor), ACTOR_LABELS[i]) {} catch {}
            }
		}
	}

    // ――――――――――――――――――――――――― Helpers ――――――――――――――――――――――――――

    function toActorAddress(address addy) internal view returns (address) {
        Actor _actor = actors[uint256(uint160(addy)) % actors.length];
        return address(_actor);
    }

    function toActorAddressNotCurrent(address addy) internal view returns (address) {
        Actor _actor = actors[uint256(uint160(addy)) % actors.length];
        if (_actor == actor) {
            _actor = actors[(uint256(uint160(addy)) + 1) % actors.length];
        }
        return address(_actor);
    }

    function sumActorsBalances() internal view returns (uint256 sumOfBalances) {
        for (uint256 i; i < actors.length; i++) {
            sumOfBalances += actors[i].balance();
        }
    }

    function sumActorsERC20Balances(address _token) internal view returns (uint256 sumOfBalances) {
        for (uint256 i; i < actors.length; i++) {
            bytes memory data = abi.encodeWithSignature("balanceOf(address)", address(actors[i]));
            (bool success, bytes memory result) = _token.staticcall(data);
            require(success, "sumActorsERC20Balances: failed to get balance");
            sumOfBalances += abi.decode(result, (uint256));
        }
    }
}`;