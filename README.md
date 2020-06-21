# File npm package

Determine type of FILEs.

A simple wrapper over file command available in Linux systems.

Package is supported for Windows (non-linux) as well.

## Installation
```sh
npm i @signageos/file
```

## Usage
```ts
import file from 'file';

(async function () {
	const result = await file('/tmp/file-to-determine');
	console.log(result); // { type: ['ASCII text'] }
})();
```

### Interface
```ts
function file(filePath: string, options?: Options): Promise<Result>;

interface Options {
	mimeType?: boolean; // if set to true, result will contain detected mime-type of file. Default false.
	separator?: string; // default ':'
	alternativeSeparators?: string[]; // default [';', '$', '€', '>', '<']
}

interface Result {
	mimeType?: string; // detected mime-type of file (if option mimeType set to true)
	charset?: string; // detect charset of file (if option mimeType set to true)
	types?: string[]; // get all detected general types (if no mimeType set)
}
```

### Get version of file
```ts
import { getVersion } from 'file';

(async function () {
	const version = await getVersion();
	console.log(version); // file-5.32
})();
```

## Limitations

Currently only following features are supported:
- type: Returns default type of given file (without arguments)
- mimeType: Returns detected mime-type of given file.

## References

- https://www.darwinsys.com/file/
- http://gnuwin32.sourceforge.net/packages/file.htm

## License

- MIT
