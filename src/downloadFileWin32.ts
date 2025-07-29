/**
 * Module for downloading and extracting the Windows binaries for the 'file' command
 * This module is automatically imported when running on Windows platforms
 * @module downloadFileWin32
 */
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as Debug from 'debug';
import * as unzipper from 'unzipper';
import { downloadFile } from './httpDownloader';
const debug = Debug('@signageos/file:tools/download-file-win32');

/** URL to download the file command binary for Windows */
const WIN32_FILE_URL = 'https://2.signageos.io/build/npm/file/file-5.03-bin-win32.zip';
/** URL to download the regex library binary for Windows */
const WIN32_REGEX_URL = 'https://2.signageos.io/build/npm/regex/regex-2.7-bin-win32.zip';
/** URL to download the zlib library binary for Windows */
const WIN32_ZLIB_URL = 'https://2.signageos.io/build/npm/zlib/zlib-1.2.3-bin-win32.zip';

/**
 * Promise that downloads and extracts the necessary Windows binaries for the file command
 * This promise is automatically executed when the module is imported on Windows platforms
 */
export const promise = (async function () {
	const tmpDir = os.tmpdir();

	const fileZipFilename = Math.random().toString().substring(2) + '.zip';
	const regexFilename = Math.random().toString().substring(2) + '.zip';
	const zlibFilename = Math.random().toString().substring(2) + '.zip';

	const fileZipPath = path.join(tmpDir, fileZipFilename);
	const regexZipPath = path.join(tmpDir, regexFilename);
	const zlibZipPath = path.join(tmpDir, zlibFilename);

	const win32Path = path.join(__dirname, '..', 'dist', 'win32');

	try {
		await Promise.all([
			downloadFile(WIN32_FILE_URL, fileZipPath),
			downloadFile(WIN32_REGEX_URL, regexZipPath),
			downloadFile(WIN32_ZLIB_URL, zlibZipPath),
		]);

		if (!fs.existsSync(win32Path)) {
			fs.mkdirSync(win32Path);
		}
		await unzipFile(fileZipPath, win32Path);
		await unzipFile(regexZipPath, win32Path);
		await unzipFile(zlibZipPath, win32Path);
	} finally {
		// Clean up temporary zip files
		try {
			fs.unlinkSync(fileZipPath);
		} catch {
			/* ignore */
		}
		try {
			fs.unlinkSync(regexZipPath);
		} catch {
			/* ignore */
		}
		try {
			fs.unlinkSync(zlibZipPath);
		} catch {
			/* ignore */
		}
	}
})();

/**
 * Extracts a zip file to the specified destination
 *
 * @param zipFilePath - Path to the zip file to extract
 * @param destination - Directory where the contents should be extracted
 * @returns A Promise that resolves when extraction is complete
 */
function unzipFile(zipFilePath: string, destination: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const pendingWrites: Promise<void>[] = [];

		const handleEntry = (entry: unzipper.Entry) => {
			const fileName = entry.path;
			const type = entry.type;
			debug('unzipFile', zipFilePath, fileName);
			const destFilePath = path.join(destination, fileName);

			if (type === 'File') {
				fs.ensureDirSync(path.dirname(destFilePath));

				// Create a promise for this file write operation
				const writePromise = new Promise<void>((resolveWrite, rejectWrite) => {
					const writeStream = fs.createWriteStream(destFilePath);
					writeStream.on('finish', resolveWrite);
					writeStream.on('error', rejectWrite);
					entry.pipe(writeStream);
				});

				pendingWrites.push(writePromise);
			} else {
				// For directories or other entry types, just consume the entry
				entry.autodrain();
			}
		};

		const handleFinish = async () => {
			try {
				// Wait for all file writes to complete
				await Promise.all(pendingWrites);
				resolve();
			} catch (error) {
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		};

		fs.createReadStream(zipFilePath).pipe(unzipper.Parse()).on('entry', handleEntry).on('finish', handleFinish).on('error', reject);
	});
}
