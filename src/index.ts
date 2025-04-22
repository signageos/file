import { spawn } from 'child-process-promise';
import * as path from 'path';
import * as fs from 'fs';
import * as Debug from 'debug';
import * as querystring from 'querystring';
const debug = Debug('@signageos/file:index');

export interface Options {
	fileBinPath?: string; // path to file binary to be used instead of default
	mimeType?: boolean; // if set to true, result will contain detected mime-type of file. Default false.
	separator?: string; // default ':'
	alternativeSeparators?: string[]; // default [';', '$', '€', '>', '<']
}

type MimeType = string; // TODO all possible mimeTypes
type GeneralType = string; // TODO all possible generalTypes
type Charset = string; // TODO all possible charsets

export interface Result {
	mimeType?: MimeType;
	charset?: Charset;
	types?: GeneralType[];
}

export default async function file(filePath: string, options: Options = {}) {
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

export async function getVersion(options: Options = {}) {
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

async function getFileBinPath(options: Options) {
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

function createFileArguments(filePath: string, options: Options) {
	let separator = options.separator ?? DEFAULT_SEPARATOR;
	let alternativeSeparators = options.alternativeSeparators ?? DEFAULT_ALTERNATIVE_SEPARATORS;
	const args = [];

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

async function parseResult(rawResult: string, separator: string, options: Options) {
	const values = rawResult.substring(rawResult.indexOf(separator) + 1);

	const parsed: Result = {};

	if (options.mimeType) {
		const mimeValues = values.split(';');
		debug('mime values', mimeValues);
		parsed.mimeType = mimeValues[0].trim();
		if (mimeValues.length > 1) {
			const parsedExtra = querystring.decode(mimeValues[1].trim());
			parsed.charset = parsedExtra.charset as string;
		}
	} else {
		const typeValues = values.split(',');
		parsed.types = typeValues.map((type) => type.trim());
	}

	return parsed;
}
