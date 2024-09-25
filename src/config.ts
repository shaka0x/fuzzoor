import * as vscode from 'vscode';

export const dirsFromRoot = ['test', 'fuzzing'];

export const getConfig = (key: string) => {
    const wsUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : null;
    return vscode.workspace.getConfiguration('fuzzoor', wsUri).get(key);
}

export const updateConfig = (key: string, value: any) => {
    const wsUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : null;
    return vscode.workspace.getConfiguration('fuzzoor', wsUri).update(key, value);
}