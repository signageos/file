import * as should from 'should';
import file, { getVersion } from '../../src/index';

describe('index', function () {
	const testFile1Path = __dirname + '/mock/file1';
	const testFile2Path = __dirname + '/mock/file2.html';
	const testFile3Path = __dirname + '/mock/file3:char.html';
	const testFile4Path = __dirname + '/mock/file4:*char.html';

	describe('file', function () {
		it('should get general types', async function () {
			const result = await file(testFile1Path);
			should(result).eql({
				types: ['ASCII text'],
			});
		});

		it('should get mime-type', async function () {
			const result = await file(testFile1Path, { mimeType: true });
			should(result).eql({
				mimeType: 'text/plain',
				charset: 'us-ascii',
			});
		});

		it('should get general types of HTML', async function () {
			const result = await file(testFile2Path);
			const expectedTypes = process.platform === 'darwin' ? ['HTML document text', 'ASCII text'] : ['HTML document', 'ASCII text'];
			should(result).eql({
				types: expectedTypes,
			});
		});

		it('should get mime-type of HTML', async function () {
			const result = await file(testFile2Path, { mimeType: true });
			should(result).eql({
				mimeType: 'text/html',
				charset: 'us-ascii',
			});
		});

		it('should get mime-type of HTML with : character in file name', async function () {
			const result = await file(testFile3Path, { mimeType: true });
			should(result).eql({
				mimeType: 'text/html',
				charset: 'us-ascii',
			});
		});

		it('should get mime-type of HTML with : and * characters in file name', async function () {
			const result = await file(testFile4Path, { mimeType: true });
			should(result).eql({
				mimeType: 'text/html',
				charset: 'us-ascii',
			});
		});

		it('should fail mime-type of HTML with : and * characters in file name and not available separator', async function () {
			await should(file(testFile4Path, { mimeType: true, alternativeSeparators: [] })).rejected();
		});

		it('should throw error when file command returns error message as output', async function () {
			// This test covers cases where file command returns error messages that could
			// be mistakenly parsed as valid MIME types without proper validation
			const invalidPath = '/dev/null/invalid/path/file.txt';
			await should(file(invalidPath, { mimeType: true })).rejected();
		});
	});

	describe('getVersion', function () {
		it('should get version of file', async function () {
			const version = await getVersion();
			should(version).startWith('file-5.');
		});
	});
});
