import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { template as proxyTemplate } from "./templates/ContractProxy.sol";
import { templateFiles } from "./scaffold";
import { dirsFromRoot, getConfig } from "./config";
import { Input, Contract } from "./interfaces";

const DYNAMIC_TYPES = ['string', 'bytes', 'tuple', 'array'];

export class FileWriter {

    async createScaffold(filePaths: string[]) {
        const wsFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
        const projectFolder = path.join(wsFolder, getConfig('projectFolder') as string);
        const fuzzingDir = path.join(projectFolder, ...dirsFromRoot);

        try {
            if (fs.existsSync(fuzzingDir)) {
                const files = fs.readdirSync(fuzzingDir);
                if (files.length > 0) {
                    // Folder already exists and is not empty
                    return;
                }
            } else {
                fs.mkdirSync(fuzzingDir);
            }

            const activeTextEditor = vscode.window.activeTextEditor;
            let openInNewColumn = !!activeTextEditor;
            for (const templateFile of templateFiles) {
                let _dirPath = templateFile.inWsRoot ? projectFolder : fuzzingDir;
                if (templateFile.subdir) {
                    _dirPath = path.join(fuzzingDir, templateFile.subdir);
                    if (!fs.existsSync(_dirPath)) {
                        fs.mkdirSync(_dirPath);
                    }
                }
                if (fs.existsSync(path.join(_dirPath, templateFile.name))) {
                    vscode.window.showErrorMessage(`File ${templateFile.name} already exists`);
                    continue;
                }
                fs.writeFileSync(
                    path.join(_dirPath, templateFile.name),
                    templateFile.content,
                    { flag: 'ax' }
                );
                
                if (templateFile.openOnCreate) {
                    // Open file in new editor window
                    const doc = await vscode.workspace.openTextDocument(path.join(_dirPath, templateFile.name))
                    if (openInNewColumn) {
                        vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Beside});
                        openInNewColumn = false;
                    } else {
                        vscode.window.showTextDocument(doc, { preview: false });
                    }
                }
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }

        // Insert imports into Base.sol
        let baseImports = '';
        for (const filePath of filePaths) {
            baseImports += `\nimport "${filePath}";`;
        }
        const basePath = path.join(fuzzingDir, 'Base.sol');
        let baseContent = fs.readFileSync(basePath, 'utf-8');
        let lastImportIndex = baseContent.lastIndexOf('\nimport ');
        const nextImportIndex = baseContent.indexOf('\n', lastImportIndex + 1);
        baseContent = baseContent.slice(0, nextImportIndex) + baseImports + baseContent.slice(nextImportIndex);
        fs.writeFileSync(basePath, baseContent, 'utf-8');
    }

    append(contracts: Contract[]) {
        if (contracts.length === 0) return;

        const wsFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
        const projectFolder = path.join(wsFolder, getConfig('projectFolder') as string);
        const fuzzingDir = path.join(projectFolder, ...dirsFromRoot);
        
        const failOnUnexpectedError = getConfig('failOnUnexpectedError') as boolean;
        const forceSendETH = getConfig('forceSendETH') as boolean;
        let handlersImports = '';
        let handlersInstantiations = '';
        const constructorsParams: Set<string> = new Set();
        let baseDeclarations = '';
        let baseSetupInstantiations = '';
        let baseCtorsParamsString = '';

        // Get current content of Handlers.sol and Base.sol
        const handlersPath = path.join(fuzzingDir, 'Handlers.sol');
        let handlersContent = fs.readFileSync(handlersPath, 'utf-8');
        const basePath = path.join(fuzzingDir, 'Base.sol');
        let baseContent = fs.readFileSync(basePath, 'utf-8');

        // Create data for each contract
        for (const contract of contracts) {
            if (!contract.functions.length) continue;

            const contractName = contract.name;
            const instanceName = contractName.charAt(0) === contractName.charAt(0).toLowerCase() 
                ? `_${contractName}`
                : contractName === contractName.toUpperCase() 
                    ? contractName.toLowerCase()
                    : contractName.charAt(0).toLowerCase() + contractName.slice(1);

            // Build handlers imports and instantiations
            const proxyImport = `import {${contractName}Proxy} from "./proxies/${contractName}Proxy.sol";`;
            if (failOnUnexpectedError && !handlersContent.includes(proxyImport)) {
                handlersImports += `\n${proxyImport}`;
                handlersInstantiations += `\n\t${contractName}Proxy ${instanceName}Proxy = new ${contractName}Proxy(${instanceName});`;
            }
            
            // Build handlers and proxy functions
            const existingContractHandlers = handlersContent.includes(`function ${instanceName}_`);
            let handlersFuncs = existingContractHandlers ? '' : this.buildHeader(contractName);
            let proxyFuncs = '';
            let proxyExpectedErrors = '';
            for (const func of contract.functions) {
                if (func.name === 'receive') {
                    if (handlersContent.includes(`function ${instanceName}_receive()`)) continue;
                    handlersFuncs += `\n\n\tfunction ${instanceName}_receive() public payable useActor globalProperties {\n\t\tuint256 msgValue = clampLte(msg.value, actor.balance());\n\n\t\tvm.prank(address(actor));\n\t\t(bool success,) = address(${instanceName}).call{value: msgValue}(\"\");\n\n\t\tt(success, "receive call failed");\n\t}`;
                } else if (func.name === 'fallback') {
                    if (handlersContent.includes(`function ${instanceName}_fallback()`)) continue;
                    const isPayable = func.stateMutability === "payable";
                    handlersFuncs += `\n\n\tfunction ${instanceName}_fallback() public ${isPayable ? "payable " : ""}useActor globalProperties {${isPayable ? "\n\t\tuint256 msgValue = clampLte(msg.value, actor.balance());\n": ""}\n\t\tvm.prank(address(actor));\n\t\t(bool success,) = address(${instanceName}).call${isPayable ? "{value: msgValue}" : ""}(\"\");\n\n\t\tt(success, "fallback call failed");\n\t}`;
                } else {
                    const inputs = func.inputs.map((input: Input) => 
                        DYNAMIC_TYPES.includes(input.type) 
                            ? `${input.internalType} memory ${input.name}`
                            : `${input.internalType} ${input.name}`)
                        .join(', ');
                    if (handlersContent.includes(`function ${instanceName}_${func.name}(${inputs})`)) continue;
                    const argsCall = func.inputs.map((input: Input) => input.name).join(', ');
                    const isPayable = func.stateMutability === "payable";
                    handlersFuncs += `\n\n\tfunction ${instanceName}_${func.name}(${inputs}) public ${isPayable ? "payable " : ""}useActor globalProperties {${isPayable ? "\n\t\tuint256 msgValue = clampLte(msg.value, actor.balance());\n": ""}\n\t\tvm.prank(address(actor));\n\t\t${failOnUnexpectedError ? instanceName + "Proxy" : instanceName}.${func.name}${isPayable ? "{value: msgValue}" : ""}(${argsCall});\n\t}`;
                    if (failOnUnexpectedError) {
                        proxyFuncs += `\n\tfunction ${func.name}(${inputs}) public ${isPayable ? "payable " : ""}{\n\t\tvm.prank(msg.sender);\n\t\ttry target.${func.name}${isPayable ? "{value: msg.value}" : ""}(${argsCall}) {\n\t\t} catch Error(string memory reason) {\n\t\t\thandleError(reason, ${func.name}ExpectedErrors);\n\t\t} catch Panic(uint256 errorCode) {\n\t\t\thandlePanic(errorCode);\n\t\t} catch (bytes memory lowLevelData) {\n\t\t\thandleLowLevel(lowLevelData);\n\t\t}\n\t}`;
                        proxyExpectedErrors += `\n\tstring[] private ${func.name}ExpectedErrors;`;
                    }
                }
            }
            // Force send ETH function
            if (forceSendETH && !handlersContent.includes(`function ${instanceName}_forceSendETH(`)) {
                handlersFuncs += `\n\n\tfunction ${instanceName}_forceSendETH(uint256 amount) public useActor globalProperties {\n\t\tamount = clampLte(amount, actor.balance());\n\n\t\tactor.forceSendETH(address(${instanceName}), amount);\n\t}`;
            }

            // Insert handlers functions
            if (handlersFuncs === '') continue;
            let handlersFuncsInsertIndex;
            if (existingContractHandlers) {
                const functionStartIndex = handlersContent.lastIndexOf(`function ${instanceName}_`);
                const closingBracketIndex = this.findClosingBracket(handlersContent, functionStartIndex);
                handlersFuncsInsertIndex = handlersContent.indexOf('\n', closingBracketIndex);
            } else {
                handlersFuncsInsertIndex = handlersContent.lastIndexOf('}');
                handlersFuncs += '\n';
            }
            handlersContent = handlersContent.slice(0, handlersFuncsInsertIndex) + handlersFuncs + handlersContent.slice(handlersFuncsInsertIndex);
            fs.writeFileSync(handlersPath, handlersContent, 'utf-8');

            // Build and insert proxy contents
            // TODO: insert in file if already exists
            if (failOnUnexpectedError) {
                let proxyContent = proxyTemplate
                    .replaceAll('ContractProxy', `${contractName}Proxy`)
                    .replaceAll('Target', contractName)
                    .replace('filePath', contract.filePath)
                    .replace('// expectedErrors', proxyExpectedErrors)
                    .replace("// functions", proxyFuncs);
                fs.writeFileSync(path.join(fuzzingDir, 'proxies', `${contractName}Proxy.sol`), proxyContent, 'utf-8');
            }

            // Build base contents
            const contractDeclaration = `${contractName} ${instanceName};`;
            if (baseContent.includes(contractDeclaration)) continue;
            baseDeclarations += `\t${contractDeclaration}\n`;
            let inputs = '';
            let inputsArray: string[] = [];
            if (contract.ctor?.inputs?.length) {
                for (const input of contract.ctor.inputs) {
                    inputs += `${input.name}, `;
                    const inputWithType = DYNAMIC_TYPES.includes(input.type) 
                        ? `${input.internalType} memory ${input.name}`
                        : `${input.internalType} ${input.name}`;
                    if (constructorsParams.has(inputWithType)) continue;
                    constructorsParams.add(input.internalType);
                    baseCtorsParamsString += `\n\t\t${inputWithType} = ${this.getDefaultValue(input)}; // TODO: set value`;
                }
                inputs = inputs.slice(0, -2);
                inputsArray = contract.ctor.inputs.map((input: Input) => `${input.name}`);
            }
            baseSetupInstantiations += `\n\t\t${instanceName} = new ${contractName}(${inputsArray.join(', ')});`;
        };

        // Insert imports and instantiations into Handlers.sol
        if (handlersImports !== '') {
            const lastImportIndex = handlersContent.lastIndexOf('\nimport ');
            const lastImportNextLineIndex = handlersContent.indexOf('\n', lastImportIndex);
            handlersContent = handlersContent.slice(0, lastImportNextLineIndex) + handlersImports + handlersContent.slice(lastImportNextLineIndex);
            
            let contractStartIndex = handlersContent.lastIndexOf('abstract contract Handlers');
            contractStartIndex = handlersContent.indexOf('{', contractStartIndex);
            const firstLineIndex = handlersContent.indexOf('\n', contractStartIndex);
            handlersContent = handlersContent.slice(0, firstLineIndex) + handlersInstantiations + handlersContent.slice(firstLineIndex);
            
            fs.writeFileSync(handlersPath, handlersContent, 'utf-8');
        }
        
        // Insert contract instantiations into Base.sol        
        const setupFunctionIndex = baseContent.indexOf('function setup()');
        if (baseCtorsParamsString !== '') {
            const setupFunctionNextLineIndex = baseContent.indexOf('\n', setupFunctionIndex);
            baseContent = baseContent.slice(0, setupFunctionNextLineIndex) + baseCtorsParamsString + baseContent.slice(setupFunctionNextLineIndex);
        }
        const setupHeaderIndex = baseContent.indexOf('―― Setup ――');
        const setupHeaderPrevLineIndex = baseContent.lastIndexOf('\n', setupHeaderIndex);
        baseContent = baseContent.slice(0, setupHeaderPrevLineIndex) + baseDeclarations + baseContent.slice(setupHeaderPrevLineIndex);

        const functionStartIndex = baseContent.indexOf('function setup()');
        const closingBracketIndex = this.findClosingBracket(baseContent, functionStartIndex);
        const closingBracketPrevLineIndex = baseContent.lastIndexOf('\n', closingBracketIndex);
        baseContent = baseContent.slice(0, closingBracketPrevLineIndex) + baseSetupInstantiations + baseContent.slice(closingBracketPrevLineIndex);

        fs.writeFileSync(basePath, baseContent, 'utf-8');
    }

    private findClosingBracket(fileContent: string, functionStartIndex: number) {
        let openBrackets = 0;
        let closeBrackets = 0;
        let functionBodyStart = fileContent.indexOf('{', functionStartIndex);
    
        if (functionBodyStart === -1) {
            console.log(`Opening bracket for function not found.`);
            return -1;
        }
    
        for (let i = functionBodyStart; i < fileContent.length; i++) {
            if (fileContent[i] === '{') {
                openBrackets++;
            } else if (fileContent[i] === '}') {
                closeBrackets++;
            }
    
            if (openBrackets > 0 && openBrackets === closeBrackets) {
                return i;
            }
        }
    
        console.log(`Closing bracket for function not found.`);
        return -1;
    }

    private getDefaultValue(input: Input): string {
        const type = input.type;
        const internalType = input.internalType;

        if (type.startsWith('uint') || type.startsWith('int')) {
            return '0';
        } else if (type === 'bool') {
            return 'false';
        } else if (type === 'address') {
            return 'address(0)';
        } else if (type === 'string') {
            return '""';
        } else if (type === 'bytes') {
            return 'hex""';
        } else if (type.startsWith('bytes')) {
            return `${internalType}(0)`;
        } else if (type === 'array') {
            return `new ${internalType}(1)`;
        } else if (type === 'enum') {
            return `${internalType}(0)`;
        } else if (type === 'contract') {
            return `${internalType}(address(0))`;
        } else if (type === 'tuple') {
            return `${internalType}({})`; 
        } else {
            return `${internalType}()`;
        }
    }

    private buildHeader(str: string): string {
        const length = 60;

        if (str.length > length - 4) return `\n\t// ${str}`;

        const leftPad = Math.floor((length - 2 - str.length) / 2);
        const rightPad = length - 2 - str.length - leftPad;
        return `\n\t// ${'―'.repeat(leftPad)} ${str} ${'―'.repeat(rightPad)}`;
    }
}