/**
 * HTTP/HTTPS file downloader utility using Node.js built-in modules
 * @module httpDownloader
 */
import * as fs from 'fs-extra';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

/**
 * Downloads a file from URL to a local path
 *
 * @param url - URL to download from
 * @param filePath - Local file path to save to
 * @param options - Optional configuration
 * @returns Promise that resolves when download is complete
 */
export function downloadFile(url: string, filePath: string, options: DownloadOptions = {}): Promise<void> {
	const { timeout = 30000 } = options;

	return new Promise<void>((resolve, reject) => {
		const parsedUrl = new URL(url);
		const client = parsedUrl.protocol === 'https:' ? https : http;

		const handleResponse = (response: http.IncomingMessage) => {
			// Handle redirects
			if (response.statusCode === 301 || response.statusCode === 302) {
				if (response.headers.location) {
					// Handle relative redirects by resolving against the original URL
					const redirectUrl = new URL(response.headers.location, url).toString();
					downloadFile(redirectUrl, filePath, options).then(resolve).catch(reject);
					return;
				}
			}

			if (response.statusCode !== 200) {
				reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
				return;
			}

			const fileStream = fs.createWriteStream(filePath);

			response.on('error', reject);
			fileStream.on('error', reject);
			fileStream.on('finish', () => {
				fileStream.close();
				resolve();
			});

			response.pipe(fileStream);
		};

		const request = client.get(url, handleResponse);

		request.on('error', reject);

		request.setTimeout(timeout, () => {
			request.destroy();
			reject(new Error(`Download timeout for ${url} (${timeout}ms)`));
		});
	});
}

/**
 * Configuration options for file download
 */
export interface DownloadOptions {
	/** Request timeout in milliseconds. Default: 30000 (30 seconds) */
	timeout?: number;
}
