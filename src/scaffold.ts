import { content as echidnaConfigContent } from "./files/echidna.yaml";
import { content as medusaConfigContent } from "./files/medusa.json";
import { content as configContent } from "./files/Config.sol";
import { content as actorContent } from "./files/Actor.sol";
import { content as baseContent } from "./files/Base.sol";
import { content as baseProxyContent } from "./files/BaseProxy.sol";
import { content as handlersContent } from "./files/Handlers.sol";
import { content as propertiesContent } from "./files/Properties.sol";
import { content as snapshotsContent } from "./files/Snapshots.sol";
import { content as fuzzTesterContent } from "./files/FuzzTester.sol";
import { content as foundryTesterContent } from "./files/FoundryTester.sol";
import { content as hevmContent } from "./files/Hevm.sol";
import { content as propertiesHelperContent } from "./files/PropertiesHelper.sol";
import { content as loggerContent } from "./files/Logger.sol";
import { content as deployerContent } from "./files/Deployer.sol";
import { content as decimalPrinterContent } from "./files/DecimalPrinter.sol";
import { content as readmeContent } from "./files/README.md";
import { ScaffoldFile } from "./interfaces";

export const templateFiles: ScaffoldFile[] = [
    {
        name: "echidna.yaml",
        content: echidnaConfigContent,
        inWsRoot: true
    },
    {
        name: "medusa.json",
        content: medusaConfigContent,
        inWsRoot: true
    },
    {
        name: "README.md",
        content: readmeContent,
        openOnCreate: true
    },
    {
        name: "Actor.sol",
        content: actorContent,
        openOnCreate: true
    },
    {
        name: "Config.sol",
        content: configContent,
        openOnCreate: true,
    },
    {
        name: "Base.sol",
        content: baseContent,
        openOnCreate: true
    },
    // {
    //     name: "BaseProxy.sol",
    //     content: baseProxyContent,
    //     subdir: "proxies",
    //     openOnCreate: false
    // },
    {
        name: "Snapshots.sol",
        content: snapshotsContent,
        openOnCreate: true
    },
    {
        name: "Properties.sol",
        content: propertiesContent,
        openOnCreate: true
    },
    {
        name: "Handlers.sol",
        content: handlersContent,
        openOnCreate: true
    },
    {
        name: "FuzzTester.sol",
        content: fuzzTesterContent
    },
    {
        name: "FoundryTester.sol",
        content: foundryTesterContent
    },
    {
        name: "Hevm.sol",
        content: hevmContent,
        subdir: "utils"
    },
    {
        name: "PropertiesHelper.sol",
        content: propertiesHelperContent,
        subdir: "utils"
    },
    {
        name: "Logger.sol",
        content: loggerContent,
        subdir: "utils"
    },
    {
        name: "Deployer.sol",
        content: deployerContent,
        subdir: "utils"
    },
    {
        name: "DecimalPrinter.sol",
        content: decimalPrinterContent,
        subdir: "utils"
    }
]