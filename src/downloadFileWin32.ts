/**
 * Module for downloading and extracting the Windows binaries for the 'file' command
 * This module is automatically imported when running on Windows platforms
 * @module downloadFileWin32
 */
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as Debug from 'debug';
import * as download from 'download';
import * as unzipper from 'unzipper';
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

	const fileZipFilename = Math.random().toString().substr(2) + '.zip';
	const regexFilename = Math.random().toString().substr(2) + '.zip';
	const zlibFilename = Math.random().toString().substr(2) + '.zip';

	const fileZipPath = path.join(tmpDir, fileZipFilename);
	const regexZipPath = path.join(tmpDir, regexFilename);
	const zlibZipPath = path.join(tmpDir, zlibFilename);

	const win32Path = path.join(__dirname, '..', 'dist', 'win32');

	try {
		await Promise.all([
			download(WIN32_FILE_URL, tmpDir, { filename: fileZipFilename }),
			download(WIN32_REGEX_URL, tmpDir, { filename: regexFilename }),
			download(WIN32_ZLIB_URL, tmpDir, { filename: zlibFilename }),
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
		} catch (error) {
			/* ignore */
		}
		try {
			fs.unlinkSync(regexZipPath);
		} catch (error) {
			/* ignore */
		}
		try {
			fs.unlinkSync(zlibZipPath);
		} catch (error) {
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
		fs.createReadStream(zipFilePath)
			.pipe(unzipper.Parse())
			.on('entry', (entry) => {
				const fileName = entry.path;
				const type = entry.type;
				debug('unzipFile', zipFilePath, fileName);
				const destFilePath = path.join(destination, fileName);
				if (type === 'File') {
					fs.ensureDirSync(path.dirname(destFilePath));
					entry.pipe(fs.createWriteStream(destFilePath));
				}
			})
			.on('finish', () => resolve())
			.on('error', (error) => reject(error));
	});
}
