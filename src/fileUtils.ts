import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export namespace FileUtils {
	function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
		if (error) {
			reject(massageError(error));
		} else {
			resolve(result);
		}
	}

	function massageError(error: Error & { code?: string }): Error {
		if (error.code === 'ENOENT') {
			return vscode.FileSystemError.FileNotFound();
		}

		if (error.code === 'EISDIR') {
			return vscode.FileSystemError.FileIsADirectory();
		}

		if (error.code === 'EEXIST') {
			return vscode.FileSystemError.FileExists();
		}

		if (error.code === 'EPERM' || error.code === 'EACCES') {
			return vscode.FileSystemError.NoPermissions();
		}

		return error;
	}

	function normalizeNFC(items: string): string;
	function normalizeNFC(items: string[]): string[];
	function normalizeNFC(items: string | string[]): string | string[] {
		if (process.platform !== 'darwin') {
			return items;
		}

		if (Array.isArray(items)) {
			return items.map(item => item.normalize('NFC'));
		}

		return items.normalize('NFC');
	}

	export function readDir(_path: string): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			fs.readdir(_path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
		});
	}

    function getType(fsStat: fs.Stats): vscode.FileType {
        return fsStat.isFile() ? vscode.FileType.File : fsStat.isDirectory() ? vscode.FileType.Directory : fsStat.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown;
	}

    function typeFromPath(_path: string): Promise<vscode.FileType> {
        return new Promise<vscode.FileType>((resolve, reject) => {
            fs.stat(_path, (error, stat) => handleResult(resolve, reject, error, getType(stat)));
        });
    }

    export async function readDirWithFiletypes(uri: string): Promise<[string, vscode.FileType][]> {
		const children = await readDir(uri);

		const result: [string, vscode.FileType][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const type = await typeFromPath(path.join(uri, child));
			result.push([child, type]);
		}

		return Promise.resolve(result);
	}
}
