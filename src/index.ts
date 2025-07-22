import { spawn } from 'child-process-promise';
import * as path from 'path';
import * as fs from 'fs';
import * as Debug from 'debug';
import * as querystring from 'querystring';
const debug = Debug('@signageos/file:index');

/**
 * Configuration options for the file command
 */
export interface Options {
	/** Path to file binary to be used instead of default */
	fileBinPath?: string;
	/** If set to true, result will contain detected mime-type of file. Default false. */
	mimeType?: boolean;
	/** Separator character used in the file command output. Default ':' */
	separator?: string;
	/** Alternative separators to try if the primary separator is found in the file path. Default [';', '$', '€', '>', '<'] */
	alternativeSeparators?: string[];
}

/**
 * Common MIME types returned by the file command
 * This is not exhaustive but covers the most common types
 */
type MimeType =
	| 'text/plain'
	| 'text/html'
	| 'text/css'
	| 'text/javascript'
	| 'application/json'
	| 'application/xml'
	| 'application/octet-stream'
	| 'image/jpeg'
	| 'image/png'
	| 'image/gif'
	| 'image/svg+xml'
	| 'audio/mpeg'
	| 'audio/ogg'
	| 'video/mp4'
	| 'video/webm'
	| 'application/pdf'
	| 'application/zip'
	| string; // Allow for other MIME types not explicitly listed

/**
 * Common file types returned by the file command
 */
type GeneralType =
	| 'ASCII text'
	| 'UTF-8 text'
	| 'UTF-16 text'
	| 'binary'
	| 'executable'
	| 'directory'
	| 'empty'
	| 'symbolic link'
	| 'HTML document'
	| 'XML document'
	| 'JSON data'
	| 'JPEG image'
	| 'PNG image'
	| 'GIF image'
	| 'PDF document'
	| 'Zip archive'
	| string; // Allow for other general types not explicitly listed

/**
 * Common character sets returned by the file command
 */
type Charset = 'us-ascii' | 'utf-8' | 'utf-16' | 'utf-16le' | 'utf-16be' | 'iso-8859-1' | 'windows-1252' | 'binary' | string; // Allow for other charsets not explicitly listed

/**
 * Result object returned by the file command
 */
export interface Result {
	/** Detected MIME type of the file (if option mimeType is set to true) */
	mimeType?: MimeType;
	/** Detected character set of the file (if option mimeType is set to true) */
	charset?: Charset;
	/** Array of general file types detected (if option mimeType is not set) */
	types?: GeneralType[];
}

/**
 * Determines the type of a file using the 'file' command
 *
 * @param filePath - Path to the file to be analyzed
 * @param options - Configuration options for the file command
 * @returns A Promise resolving to a Result object containing file type information
 * @throws If the file command fails or if the file path contains all possible separators
 */
export default async function file(filePath: string, options: Options = {}): Promise<Result> {
	const fileBinPath = await getFileBinPath(options);
	debug('bin', fileBinPath);

	const { args, separator } = createFileArguments(filePath, options);
	debug('args', { args, separator });

	const spawnProcess = spawn(fileBinPath, args, {
		capture: ['stdout', 'stderr'],
	});
	try {
		const rawResult = await spawnProcess;
		debug('raw result', rawResult);

		const parsedResult = parseResult(rawResult.stdout, separator, options);
		debug('parsed result', parsedResult);

		return parsedResult;
	} catch (error) {
		console.error(error.stderr);
		throw error;
	}
}

/**
 * Gets the version of the file command binary
 *
 * @param options - Configuration options for the file command
 * @returns A Promise resolving to a string containing the version information
 * @throws If the file command fails
 */
export async function getVersion(options: Options = {}): Promise<string> {
	const fileBinPath = await getFileBinPath(options);
	debug('bin', fileBinPath);

	const spawnProcess = spawn(fileBinPath, ['--version'], {
		capture: ['stdout', 'stderr'],
	});
	try {
		const rawResult = await spawnProcess;
		debug('raw result', rawResult);

		const parsedResult = rawResult.stdout.toString().split('\n')[0];

		return parsedResult;
	} catch (error) {
		console.error(error.stderr);
		throw error;
	}
}

const DEFAULT_UNIX_FILE_BIN_PATH = 'file';
const DEFAULT_WIN32_FILE_BIN_PATH = path.join(__dirname, 'win32', 'bin', 'file.exe');

/**
 * Determines the path to the file command binary based on platform and options
 *
 * @param options - Configuration options for the file command
 * @returns A Promise resolving to the path of the file command binary
 */
async function getFileBinPath(options: Options): Promise<string> {
	if (options.fileBinPath) {
		return options.fileBinPath;
	}
	if (process.platform === 'win32') {
		if (!fs.existsSync(DEFAULT_WIN32_FILE_BIN_PATH)) {
			const { promise } = await import('./downloadFileWin32');
			await promise;
		}
		return DEFAULT_WIN32_FILE_BIN_PATH;
	} else {
		return DEFAULT_UNIX_FILE_BIN_PATH;
	}
}

const DEFAULT_SEPARATOR = ':';
const DEFAULT_ALTERNATIVE_SEPARATORS = [';', '$', '€', '>', '<'];

/**
 * Creates arguments for the file command based on options and filePath
 *
 * @param filePath - Path to the file to be analyzed
 * @param options - Configuration options for the file command
 * @returns An object containing the arguments array and selected separator
 * @throws If the file path contains all possible separators
 */
function createFileArguments(filePath: string, options: Options): { args: string[]; separator: string } {
	let separator = options.separator ?? DEFAULT_SEPARATOR;
	const alternativeSeparators = options.alternativeSeparators ?? DEFAULT_ALTERNATIVE_SEPARATORS;
	const args: string[] = [];

	if (options.mimeType) {
		args.push('--mime');
	}

	let separatorIndex = 0;
	while (filePath.includes(separator)) {
		if (separatorIndex >= alternativeSeparators.length) {
			throw new Error(
				`File path is incorrect: ${filePath} . The separator cannot be determined from list: ${alternativeSeparators.join(',')}`,
			);
		}
		separator = alternativeSeparators[separatorIndex];
		separatorIndex++;
	}
	args.push('--separator', separator);

	args.push(filePath);

	return { args, separator };
}

/**
 * Parses the raw output from the file command into a structured Result object
 *
 * @param rawResult - Raw string output from the file command
 * @param separator - Separator character used in the output
 * @param options - Configuration options for the file command
 * @returns A Result object containing parsed file type information
 */
function parseResult(rawResult: string, separator: string, options: Options): Result {
	const values = rawResult.substring(rawResult.indexOf(separator) + 1);

	const parsed: Result = {};

	if (options.mimeType) {
		const mimeValues = values.split(';');
		debug('mime values', mimeValues);
		parsed.mimeType = mimeValues[0].trim() as MimeType;
		if (mimeValues.length > 1) {
			const parsedExtra = querystring.decode(mimeValues[1].trim());
			parsed.charset = parsedExtra.charset as Charset;
		}
	} else {
		const typeValues = values.split(',');
		parsed.types = typeValues.map((type) => type.trim() as GeneralType);
	}

	return parsed;
}
