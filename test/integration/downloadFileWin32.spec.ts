import * as path from 'path';
import * as should from 'should';
import * as fs from 'fs-extra';
import { spawn } from 'child-process-promise';

describe('downloadFileWin32', function () {
	this.timeout(10e3);

	beforeEach(async function () {
		await fs.remove(path.join(__dirname, '..', '..', 'dist', 'win32'));
	});

	it('should download and extract windows binaries', async function () {
		await spawn('ts-node', [path.join(__dirname, '..', '..', 'src', 'downloadFileWin32')]);
		should(await fs.pathExists(path.join(__dirname, '..', '..', 'dist', 'win32', 'bin', 'file.exe'))).true();
	});

	it('should fill missing windows binaries', async function () {
		await spawn('ts-node', [path.join(__dirname, '..', '..', 'src', 'downloadFileWin32')]);
		should(await fs.pathExists(path.join(__dirname, '..', '..', 'dist', 'win32', 'bin', 'file.exe'))).true();
		await fs.remove(path.join(__dirname, '..', '..', 'dist', 'win32', 'bin', 'file.exe'));
		await spawn('ts-node', [path.join(__dirname, '..', '..', 'src', 'downloadFileWin32')]);
		should(await fs.pathExists(path.join(__dirname, '..', '..', 'dist', 'win32', 'bin', 'file.exe'))).true();
	});
});
