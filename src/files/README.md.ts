export const content =
`# Structure of the Fuzzing Test Suite

\`\`\`
            +-------------+
            |             |
            | FuzzTester  |
            |             |
            +-------------+
                   |
                   |
            +-------------+
            |             |
            |  Handlers   |
            |             |
            +-------------+
                   |
                   |
            +-------------+
            |             |
            | Properties  |
            |             |
            +-------------+ 
                   |
                   |
            +-------------+
            |             |
            |  Snapshots  |
            |             |
            +-------------+ 
                   |
                   |
            +-------------+
            |             |
            |    Base     |
            |             |
            +-------------+
                   |
                   |
            +-------------+
            |             |
            |   Config    |
            |             |
            +-------------+
\`\`\`
            
## FuzzTester

Is the entry point for the fuzzing campaigns, and we should generally not need to modify it. It inherits from the \`Handlers\` contracts and performs the initial setup on construction.


## Handlers

Implements the required calls to the target contracts. Handler functions include the following modifiers:

- \`useActor\`: Sets \`actor\` global variable with the address of the \`Actor\` contract that will perform the call to the target contract. Before a call to the target contract is made, \`vm.prank(address(actor))\` is called to impersonate the actor.

- \`globalProperties\`: This modifier is implemented in the \`Properties\` contract and calls all the global properties functions. Global properties are those invariants that should always hold true for the system.


## Properties

Contains the functions that define the properties assertions for the system.

Global properties functions must be called in the \`globalProperties\` modifier so that they are checked after every call to the target contract.

Properties that only apply to specific functions must be called in the corresponding handler function in the \`Handlers\` contract.


## Snapshots

This contract is used to take snapshots of the state of the system before and after a call to the target contract, so that we can compare check if the values of the variables have changed as expected.


## Base

Provides the following utilities:
- Actors management, including the current actor and helper functions to query data about the actors.
- Ghost variables struct, which can be used to track the expected expected changes in the values of the system and compare them with the actual state of the system.
- Imports of the contracts of the system and initialization of the target contracts, which are generated automatically.


## Config

Stores configuration variables, including the addresses from which the transactions will be initiated. Each of these addresses will be mapped to an \`Actor\` contract.


## Actor

Represents the user or contract that is interacting with the system and provides some helper functions.


## FoundryTester

Used for quick testing with Foundry. Can be used to check that our handlers and properties are working as expected or to debug the sequence of calls that result in a failing property.
`;