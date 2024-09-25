import * as vscode from 'vscode';
import * as path from 'path';
import { dirsFromRoot, getConfig } from './config';

export function runEchidna(): void {
    const wsFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const projectFolder = path.join(wsFolder, getConfig('projectFolder') as string);
    const pathToBinary = getConfig('echidnaPath') as string || '';
    const echidnaPath = path.join(pathToBinary, 'echidna');
    const testerPath = path.join(projectFolder, ...dirsFromRoot, 'FuzzTester.sol');
    const configPath = path.join(projectFolder, 'echidna.yaml');
    const command = `${echidnaPath} ${testerPath} --contract FuzzTester --config ${configPath}`;
    runCommand(command);
}

export function runMedusa(): void {
    const wsFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const projectFolder = path.join(wsFolder, getConfig('projectFolder') as string);
    const pathToBinary = getConfig('medusaPath') as string || '';
    const medusaPath = path.join(pathToBinary, 'medusa');
    const configPath = path.join(projectFolder, 'medusa.json');
    const command = `${medusaPath} fuzz --config ${configPath}`;
    runCommand(command);
}

function runCommand(command: string): void {
    let terminal = vscode.window.activeTerminal;
    if (!terminal) {
        terminal = vscode.window.createTerminal();
    }
    terminal.sendText(command);
    terminal.show();
}