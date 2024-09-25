# Fuzzoor

<p align="center">
  <img src="https://github.com/shaka0x/fuzzoor/blob/main/media/fuzzoor.png" title="logo" width="200">
</p>

A Visual Studio Code extension that helps you to build and run fuzzing test suites for Solidity smart contracts.

![](https://github.com/shaka0x/fuzzoor/blob/main/media/fuzzoor.gif)

## Features

- Build fuzzing test suite automatically.
- Run Echidna and Medusa campaigns.
- View coverage reports.

## Requirements

- [Echidna](https://github.com/crytic/echidna?tab=readme-ov-file#installation)
- [Medusa](https://github.com/crytic/medusa/blob/master/docs/src/getting_started/installation.md)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Extension Settings

| Setting | Description | Default |
| --- | --- | --- |
| `fuzzoor.projectFolder` | Relative path from workspace to folder of the project. | |
| `fuzzoor.contractsFolder` | Relative path from project folder to folder of the contracts. | `src` |
| `fuzzoor.excludedFolders` | Folders to exclude in the contracts folder. | `["test", "tests", "mock", "mocks"]` |
| `fuzzoor.outputFolder` | Relative path from project folder to folder of the compilation output. | `out` |
| `fuzzoor.forceSendETH` | Include handler function to force send ether to the target contract. | `true` |
| `fuzzoor.echidnaPath` | Path to folder containing the Echidna executable binary. | |
| `fuzzoor.medusaPath` | Path to folder containing the Medusa executable binary. | |
<!-- | `fuzzoor.failOnUnexpectedError` | Check for revert with unexpected error on every function call. | `false` | -->

> [!NOTE]
> If `Echidna` and `Medusa` are added to the PATH in the system, the `fuzzoor.echidnaPath` and `fuzzoor.medusaPath` settings can be left empty.

## Video demo

[![Video demo](https://github.com/shaka0x/fuzzoor/blob/main/media/video_preview.png)](https://youtu.be/8qatdy_D2Dw)

[Demo codebase](https://github.com/shaka0x/weth-demo-fuzzoor.git)

## Acknowledgements

This extension builds on top of [Echidna](https://github.com/crytic/echidna) and [Medusa](https://github.com/crytic/medusa), created by [Trail of Bits](https://www.trailofbits.com/).

The structure of the test suite has been inspired by the work of different projects and individuals, including:

- [Rappie](https://github.com/rappie)
- [Víctor Nicolás Martínez Carralero](https://github.com/vnmrtz)
- [Antonio Viggiano](https://github.com/aviggiano)
- [Alex The Entreprenerd](https://github.com/GalloDaSballo)
- [Recon](https://getrecon.xyz/)