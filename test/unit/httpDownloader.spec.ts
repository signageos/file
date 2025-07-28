import * as should from 'should';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { downloadFile } from '../../src/httpDownloader';

describe('httpDownloader', function () {
	this.timeout(5e3);

	let tempFilePath: string;
	let testServer: http.Server;
	let serverPort: number;

	before(function (done) {
		// Create a simple test server instead of relying on external services
		testServer = http.createServer((req, res) => {
			if (req.url === '/test-file') {
				res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
				res.end('test content');
			} else if (req.url === '/timeout') {
				// Don't respond to simulate timeout
				return;
			} else if (req.url === '/404') {
				res.writeHead(404, { 'Content-Type': 'text/plain' });
				res.end('Not Found');
			} else if (req.url === '/redirect') {
				res.writeHead(302, { Location: '/test-file' });
				res.end();
			} else {
				res.writeHead(404);
				res.end();
			}
		});

		testServer.listen(0, () => {
			const address = testServer.address();
			serverPort = typeof address === 'object' && address ? address.port : 0;
			done();
		});
	});

	after(function (done) {
		if (testServer) {
			testServer.close(done);
		} else {
			done();
		}
	});

	beforeEach(function () {
		const tempDir = os.tmpdir();
		tempFilePath = path.join(tempDir, `test-download-${Math.random().toString().substring(2)}.tmp`);
	});

	afterEach(async function () {
		try {
			await fs.unlink(tempFilePath);
		} catch {
			// ignore if file doesn't exist
		}
	});

	describe('downloadFile', function () {
		it('should download a file from HTTP URL', async function () {
			const testUrl = `http://localhost:${serverPort}/test-file`;

			await downloadFile(testUrl, tempFilePath);

			should(await fs.pathExists(tempFilePath)).true();
			const content = await fs.readFile(tempFilePath, 'utf8');
			should(content).equal('test content');
		});

		it('should handle download timeout', async function () {
			const testUrl = `http://localhost:${serverPort}/timeout`;

			await should(downloadFile(testUrl, tempFilePath, { timeout: 100 })).rejected();
		});

		it('should handle HTTP errors', async function () {
			const testUrl = `http://localhost:${serverPort}/404`;

			await should(downloadFile(testUrl, tempFilePath)).rejected();
		});

		it('should handle redirects', async function () {
			const testUrl = `http://localhost:${serverPort}/redirect`;

			await downloadFile(testUrl, tempFilePath);

			should(await fs.pathExists(tempFilePath)).true();
			const content = await fs.readFile(tempFilePath, 'utf8');
			should(content).equal('test content');
		});
	});
});
