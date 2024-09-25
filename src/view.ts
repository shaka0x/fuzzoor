import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from "fs";
import { FileUtils } from './fileUtils';
import { FileWriter } from './fileWriter';
import { runEchidna, runMedusa } from './commands';
import { openReport, ReportType } from './webview';
import { Contract, Func, Input } from './interfaces';
import { Entry, EntryType } from './viewEntry';
import { getConfig, updateConfig } from './config';

let stopTreeBuilding = false; // Used to prevent building process getting stuck due to wrong folders configuration
let fileNotFoundErrorCount = 0;

const setProjectFolder = async () => {
	const projectFolder = await vscode.window.showInputBox({
		placeHolder: "",
		prompt: "Set the relative path of the project folder in the workspace",
		value: getConfig('projectFolder') as string || ""
	}) || "";

	updateConfig('projectFolder', projectFolder);
}

const setContractsFolder = async () => {
	const contractsRelPath = await vscode.window.showInputBox({
		placeHolder: "src",
		prompt: "Set the relative path of the contracts folder in the project",
		value: getConfig('contractsFolder') as string || ""
	}) || "";

	updateConfig('contractsFolder', contractsRelPath);
}

const setOutputFolder = async () => {
	const outputRelPath = await vscode.window.showInputBox({
		placeHolder: "out",
		prompt: "Set the relative path of the compilation output folder in the project",
		value: getConfig('outputFolder') as string || ""
	}) || "";

	updateConfig('outputFolder', outputRelPath);
}

export class ViewProvider implements vscode.TreeDataProvider<Entry> {
	private _onDidChangeFile: vscode.EventEmitter<vscode.FileChangeEvent[]>;
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | void> = new vscode.EventEmitter<Entry | undefined | void>();
	allFiles: string[] = [];
	topLevelEntries: Entry[] = [];

	constructor() {
		this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
		this._onDidChangeTreeData = new vscode.EventEmitter<Entry | undefined | void>();
	}

	private async _findChildren(projectFolder: string, contractsFolder: string, entry?: Entry): Promise<Entry[]> {
		if (stopTreeBuilding) return [];
		const dirPath = entry?.filePath || contractsFolder;
		const children = await FileUtils.readDirWithFiletypes(dirPath);
		const excludedFolders = getConfig('excludedFolders') as string[] || [];

		let dirEntries = children
			.filter(([name, type]) => (type === vscode.FileType.Directory && !excludedFolders.includes(name.toLowerCase())))
			.map(([name, ]) => (
				new Entry(
					Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
					entry?.id || null,
					name,
					EntryType.dir,
					vscode.TreeItemCollapsibleState.Collapsed,
					path.join(dirPath, name),
				)
			))
			.sort((a, b) => a.label.localeCompare(b.label));

		let contractEntries = children
			.filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.sol'))
			.flatMap(([name, ]) => {
				const relPath = path.relative(projectFolder, path.join(dirPath, name));
				this.allFiles.push(relPath);
				return this._findContracts(path.join(dirPath, name))
					.map(contract => {
						const newEntry = new Entry(
							Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
							entry?.id || null,
							contract,
							EntryType.contract,
							vscode.TreeItemCollapsibleState.Collapsed,
							path.join(dirPath, name),
						)
						newEntry.tooltip = relPath;
						return newEntry;
					})
			})
			.sort((a, b) => a.label.localeCompare(b.label));

		const outputRelPath = getConfig('outputFolder') as string || "out";
		const outputPath = path.join(projectFolder, outputRelPath);
		if (!fs.existsSync(outputPath)) {
			vscode.window.showErrorMessage(`Compilation output folder "${outputPath}" not found. Check if is set to the correct path and if contracts have been compiled.`);
			return [];
		}

		for (const contractEntry of contractEntries) {
			if (stopTreeBuilding) return [];
			const functions = this._getFunctions(
				path.relative(projectFolder, contractEntry.filePath),
				contractEntry.label,
				outputPath
			);

			if (functions.length === 0) continue;
			if (functions[0].name === 'constructor') {
				contractEntry.contractCtor = functions[0];
				functions.shift();
			}
			
			contractEntry.children = functions.map(func => new Entry(
				Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
				contractEntry.id,
				func.name,
				EntryType.function,
				vscode.TreeItemCollapsibleState.None,
				contractEntry.filePath,
				"(" + func.inputs.map(input => input.internalType).join(', ') + ")",
				func.inputs,
				func.stateMutability
			));
		}
		contractEntries = contractEntries.filter(entry => entry.children && entry.children.length > 0);
		
		for (const dirEntry of dirEntries) {
			const children = await this._findChildren(projectFolder, contractsFolder, dirEntry);
			dirEntry.children = children
		}
		dirEntries = dirEntries.filter(entry => entry.children && entry.children.length > 0);

		return [...dirEntries, ...contractEntries];
	}

	private _findContracts(filePath: string): string[] {
		let contents = fs.readFileSync(filePath, 'utf-8')
			.replace(/\/\/.*$/gm, '') // Remove single line comments
			.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi line comments

		const contractRegex = /\bcontract\s+([a-zA-Z0-9_]+)\b/g;
		let match;
		const contracts = [];
	
		while ((match = contractRegex.exec(contents)) !== null) {
			contracts.push(match[1]);
		}
	
		return contracts;
	}

	private _mapInputs(inputs: any[]): Input[] {
        return inputs.map((input: any) => {
            let internalType = input.internalType;
            let type = input.type.includes('[]') ? 'array' : input.type;
            
            if (internalType.startsWith('struct ')) {
                internalType = internalType.slice(7);
            } else if (internalType.startsWith('contract ')) {
                internalType = internalType.slice(9);
                type = 'contract';
            } else if (internalType.startsWith('enum ')) {
                internalType = internalType.slice(5);
                type = 'enum';
            }

            return {
                name: input.name,
                type: type,
                internalType: internalType
            };
        });
    }

	private _getFunctions(fileRelPath: string, contractName: string, outputPath: string): Func[] {
        let pathToOutput = path.join(outputPath, path.basename(fileRelPath), `${contractName}.json`);
		if (!fs.existsSync(pathToOutput)) {
			// Hardhat output is organized in directories
			pathToOutput = path.join(outputPath, fileRelPath, `${contractName}.json`);
			if (!fs.existsSync(pathToOutput)) {
				// Avoid showing the same error message too many times
				if (fileNotFoundErrorCount < 3) {
					fileNotFoundErrorCount++;
					vscode.window.showErrorMessage(`File "${pathToOutput}" not found. Check if compilation output folder is set to the correct path and if contracts have been compiled.`);
				}
				return [];
			}
		}

        const output = JSON.parse(fs.readFileSync(pathToOutput, 'utf-8'));
        const abi = output.abi as any[];

        const functions = abi.filter((item: any) => item.type === 'function' && item.stateMutability !== 'view')
            .map((item: any) => {
                return {
                    name: item.name,
                    inputs: this._mapInputs(item.inputs),
                    stateMutability: item.stateMutability
                };
            });

        const fallbackAbi = abi.find((item: any) => item.type === 'fallback');
        if (fallbackAbi) {
            functions.push({
                name: 'fallback',
                inputs: [],
                stateMutability: fallbackAbi.stateMutability
            });
        }

        const receiveAbi = abi.find((item: any) => item.type === 'receive');
        if (receiveAbi) {
            functions.push({
                name: 'receive',
                inputs: [],
                stateMutability: receiveAbi.stateMutability
            });
        }

		const constructorAbi = abi.find((item: any) => item.type === 'constructor');
        if (constructorAbi) {
			functions.unshift({
				name: 'constructor',
				inputs: this._mapInputs(constructorAbi.inputs),
				stateMutability: constructorAbi.stateMutability
			});
        }

        return functions;
    }

	get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
		return this._onDidChangeFile.event;
	}

	get onDidChangeTreeData(): vscode.Event<Entry | undefined | void> {
		return this._onDidChangeTreeData.event;
	}

	refresh(entry?: Entry): void {
		this._onDidChangeTreeData.fire(entry);
	}

	// Tree data provider

	async getChildren(element?: Entry): Promise<Entry[]> {
		stopTreeBuilding = false;
		fileNotFoundErrorCount = 0;

		if (element) {
			return element.children || [];
		}

		const wsFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const projectFolder = path.join(wsFolder, getConfig('projectFolder') as string);
		const contractsFolder = path.join(projectFolder, getConfig('contractsFolder') as string);
		
		if (contractsFolder) {
			this.allFiles = [];

			// Get top level directories
			if (!fs.existsSync(contractsFolder)) {
				vscode.window.showErrorMessage(`Contracts folder "${contractsFolder}" not found`);
				return [];
			}

			this.topLevelEntries = await this._findChildren(projectFolder, contractsFolder);
			if (stopTreeBuilding) {
				vscode.window.showWarningMessage('Building process stopped');
				return [];
			}

			return this.topLevelEntries;
		}

		return [];
	}

	getTreeItem(element: Entry): vscode.TreeItem {
		if (element.contextValue !== EntryType.dir) {
			element.command = { command: 'fuzzoor.toggle', title: "Check/Uncheck", arguments: [element] };
		}
		return element;
	}

	private findParentHelper(element: Entry, id: string): Entry | null {
        if (!element) return null;
        if (element.id === id) return element;
		if (!element.children) return null;
        for (let child of element.children) {
            const result = this.findParentHelper(child, id);
            if (result) return result;
        }
        return null;
    }

	getParent(element: Entry): vscode.ProviderResult<Entry> {
		if (!element.parentId) return null;
		for (let entry of this.topLevelEntries) {
			const result = this.findParentHelper(entry, element.parentId);
			if (result) return result;
		}
		return null;
	}
}

export class View {
	treeDataProvider: ViewProvider;

	constructor(context: vscode.ExtensionContext) {
		this.treeDataProvider = new ViewProvider();
		const fileWriter = new FileWriter();
		const tree = vscode.window.createTreeView('fuzzoor', { treeDataProvider: this.treeDataProvider });
		context.subscriptions.push(tree);

		// Register commands
		vscode.commands.registerCommand('fuzzoor.toggle', (entry: Entry) => this._toggleEntry(entry));
		vscode.commands.registerCommand('fuzzoor.refreshAll', () => this.treeDataProvider.refresh());
		vscode.commands.registerCommand('fuzzoor.stopTreeBuilding', () => stopTreeBuilding = true);
		vscode.commands.registerCommand("fuzzoor.build", () => {
			fileWriter.createScaffold(this.treeDataProvider.allFiles)
				.then(() => fileWriter.append(this._contractSelection()));
		});
		vscode.commands.registerCommand('fuzzoor.setProjectFolder', () => setProjectFolder());
		vscode.commands.registerCommand('fuzzoor.setContractsFolder', () => {
			stopTreeBuilding = true;
			setContractsFolder();
		});
		vscode.commands.registerCommand('fuzzoor.setOutputFolder', () => {
			stopTreeBuilding = true;
			setOutputFolder();
		});
		vscode.commands.registerCommand('fuzzoor.runEchidna', () => runEchidna());
		vscode.commands.registerCommand('fuzzoor.runMedusa', () => runMedusa());
		vscode.commands.registerCommand('fuzzoor.echidnaCoverage', () => openReport(ReportType.ECHIDNA_COVERAGE));
		vscode.commands.registerCommand('fuzzoor.medusaCoverage', () => openReport(ReportType.MEDUSA_COVERAGE));
		vscode.commands.registerCommand('fuzzoor.echidnaCoverageContract', (entry: Entry) => openReport(ReportType.ECHIDNA_COVERAGE, entry.filePath));
		vscode.commands.registerCommand('fuzzoor.medusaCoverageContract', (entry: Entry) => openReport(ReportType.MEDUSA_COVERAGE, entry.filePath));

		// Subscribe
		context.subscriptions.push(tree);
	}

	private _toggleEntry(entry: Entry): void {
		const checkedIconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'checked.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'checked.svg')
		};
		const uncheckedIconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'unchecked.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'unchecked.svg')
		};

		entry.checked = !entry.checked;
		entry.iconPath = entry.checked ? checkedIconPath : uncheckedIconPath;
		this.treeDataProvider.refresh(entry);

		if (entry.checked) {
			if (entry.contextValue === 'contract') {
				entry.children?.forEach(child => {
					child.checked = true;
					child.iconPath = checkedIconPath;
				});
			} else { // function
				const parent: Entry = this.treeDataProvider.getParent(entry) as Entry;
				if (parent.children?.every(child => child.checked)) {
					parent.checked = true;
					parent.iconPath = checkedIconPath;
				}
				this.treeDataProvider.refresh(parent);
			}
		} else {
			if (entry.contextValue === 'contract') {
				entry.children?.forEach(child => {
					child.checked = false;
					child.iconPath = uncheckedIconPath;
				});
			} else { // function
				const parent: Entry = this.treeDataProvider.getParent(entry) as Entry;
				parent.checked = false;
				parent.iconPath = uncheckedIconPath;
				this.treeDataProvider.refresh(parent);
			}
		}
	}

	private _contractSelection(): Contract[] {
		const contractEntries: Entry[] = [];
		const stack: Entry[] = [...this.treeDataProvider.topLevelEntries];

		while (stack.length > 0) {
			const entry = stack.pop() as Entry;
			if (entry.contextValue === EntryType.contract) {
				contractEntries.push(entry);
			} else if (entry.contextValue === EntryType.dir && entry.children) {
				stack.push(...entry.children);
			}
		}

		const contracts = contractEntries.map(entry => ({	
			name: entry.label,
			filePath: entry.filePath,
			ctor: entry.contractCtor,
			functions: this._mapSelectedFuncs(entry.children)
		}));

		return contracts;
	}

	private _mapSelectedFuncs(entries: Entry[]): Func[] {
		return entries.filter(entry => entry.checked)
			.map(entry => ({
				name: entry.label,
				inputs: entry.inputs || [],
				stateMutability: entry.stateMutability!
			}));
	}
}