import * as vscode from 'vscode';
import * as path from 'path';
import { Func, Input } from './interfaces';

export enum EntryType {
    dir = 'dir',
    contract = 'contract',
    function = 'function'
}

export class Entry extends vscode.TreeItem {
	public children: Entry[] = [];
	public checked: boolean = false;
    public contractCtor: Func | undefined;
	
	constructor(
		public readonly id: string,
		public readonly parentId: string | null,
		public readonly label: string,
		public readonly contextValue: EntryType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly filePath: string,
		public readonly description?: string,
        public readonly inputs?: Input[] | undefined,
        public readonly stateMutability?: string | undefined
	) {
		super(label, collapsibleState);

		if (this.contextValue === EntryType.dir) {
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'dir.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dir.svg')
			};
		} else {
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'unchecked.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'unchecked.svg')
			};
		}
	}
}