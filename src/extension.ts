import * as vscode from 'vscode';
import { View } from './view';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
	
	if (!rootPath) {
		vscode.window.showErrorMessage('No workspace folder found');
		return;
	}

	new View(context);
}
