# clean-dts

Attempting to create a clean d.ts file when writing node modules mainly. The idea is to create a single d.ts outputfile. The problem with typescript's own d.ts files is the following:

1. Files can either be converted to d.ts file by keeping the folders structure (i.e. not combined) [we want combined/concatenated d.ts].
2. When selecting an output file name when creating definition files (i.e. to combine them) the result is not what correct

we don't want:

```ts
declare module 'some/mod` {
	// some code
}
declare module 'filename` {
	// some code
}
```

but rather one of the following options:

```ts
// some code from some/mod.ts
// some code from index.ts
```

or:

```ts
declare myModule {
	// some code from some/mod.ts
	// some code from index.ts
}

```

This module can be used from [command prompt](./#Cli) or through [code](./#Usage).

## Install

Install the module through the console, and in the desired file location:

```bash
npm install clean-dts
```

### Usage

General usage:

```js
const { cleanDtsSync, cleanDts } = require('clean-dts');

// PASSING CONTENT AS STRING AND RECEIVING BACK CONTENT
const someContent = 'some content that represents a d.ts file';

const result = cleanDtsSync({}, '');

// OR THROUGH OPTIONS
const options = {
	file: 'location/file.d.ts',
	outputDir: 'bin/location',
};

cleanDtsSync(options);

// OR THE SAME AS ABOVE BUT ASYNC
cleanDts(options).then(/*some code */);
```

### Method

2 main methods is set out below to utilize the cleanDts functions:

#### all

If all option is used, all the modules will be combined into one:

```ts
// original.d.ts
declare module 'abc' {
	/* some code inside abc */
}
declare module 'def' {
	/* some code inside def */
}
```

will become:

```ts
// if all is set to newMod:
declare module 'newMod' {
	/* some code inside abc */
	/* some code inside def */
}
// OR if all is set to '' or '/'

/* some code inside abc */
/* some code inside def */
```

Using all is the fastest way to parse through the data as cleanDts does not care about exported members. The pitfall is if there are multiple export members with the same name, the output definition file will have errors.

#### \$Mod

A more delicate way to deal with the combining files is by using a \$Mod comment. e.g.

```ts
declare module 'xyz' {
	export function xyzFunc(): string;
}
declare module 'def' {
	export function defFunc(): string;
}
declare module 'abc' {
	export function abcFunc(): string;
	export { xyzFunc } from 'xyz';
	/* $mod='cde' */
	export { defFunc } from 'def';
	/* $modend */
}
```

will result in:

```ts
declare module 'xyz' {
	export function xyzFunc(): string;
}
declare module cde {
	export function abcFunc(): string;
	export { xyzFunc } from 'xyz';
	export function defFunc(): string;
}
```

Therefore, because def does not have any exported members that was not already declared in ('new cde module'), it is excluded, unless the storeStrategy is set to 'keepAll' (2).

Also note that only files inbetween the \$mod comments down will be exported as if those members were local to the module.

Also note that $modend is not required if the entire module should be modified from $mod=''.

The following is also acceptable:

```ts
declare module 'xyz' {
	export function xyzFunc(): string;
}
declare module 'def' {
	export function defFunc(): string;
}
declare module 'abc' {
	export function abcFunc(): string;
	export { xyzFunc } from 'xyz';
	/* $mod */
	export { defFunc } from 'def';
	/* $modend */
}
```

and will result in:

```ts
declare module xyz {
	export function xyzFunc(): string;
}
declare module abc {
	export function abcFunc(): string;
	export { xyzFunc } from 'xyz';
	export function defFunc(): string;
}
```

(e.g. no change in module name)

OR:

```ts
declare module 'xyz' {
	export function xyzFunc(): string;
}
declare module 'def' {
	export function defFunc(): string;
}
declare module 'abc' {
	export function abcFunc(): string;
	export { xyzFunc } from 'xyz';
	/* $mod=''*/
	// OR
	/* $mod='/' */
	export { defFunc } from 'def';
	/* $modend */
}
```

will result in:

```ts
declare module xyz {
	export function xyzFunc(): string;
}

export function abcFunc(): string;
export { xyzFunc } from 'xyz';
export function defFunc(): string;
```

Please also note storeStrategies below, that determine how def will be stored in the above example. i.e if partially used (therefore other export members exist that was not exported by abc module) and keepPartial is set as storeStrategy, then def will be kept, else def will be removed as it is already partially used in abc.

Similarly if all exported members of module def is exported by abc module as shown in above example and sotreStrategy is set to keepAll, then the result of module abc will still be the same as above, however module def will also be included in the output file (unlike above).

### Options

| name          | type             | description                                                                                                                                                                                                                                       |
| ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| storeStrategy | Strategies(enum) | An optional variable used to determine what to store.                                                                                                                                                                                             |
| all           | string           | An optional value that changes all the module names to the given value ('can be empty string'). Please note that '/' and '' is equal, and will not declare a module, but merely expose all the export members of all the modules inside the file. |
| file          | string           | An optional file name and file location that needs to be parsed through. (needed if no text is passed to the cleanDts function)                                                                                                                   |
| newName       | string           | An optional new name value that should be given to the file when stored. (if not provided for, and outputDir and ext is not provided for the file will be overwritten)                                                                            |
| ext           | string           | An options new extension value to be given to the file when stored.                                                                                                                                                                               |
| outputDir     | string           | An optional location for where the output file should be stored. (if none is provided, the output location will be the same as the file location)                                                                                                 |
| baseExt       | string           | An optional base extension value used when the extension name should be changed. (this value is by default d.ts).                                                                                                                                 |

#### storeStrategies [enum]

The available store strategies (gathered from Strategies enum) are as follows:

| number | name        | description                                                                                                                 |
| ------ | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| 0      | none        | will only store modules that includes /\* \$mod= / inside. Unless all option is used, then all modules will be converted.   |
| 1      | keepPartial | Will keep a module which is partially used in another module in same file (i.e. both modules will still appear on the file) |
| 2      | keepAll     | will keep all modules even if the entire module is reexported in another module in the same file.                           |

### CLI

The above can also be activated through commandPrompt.

```bash
cleandts [file1] [file2...] --arg
```

If folder instead of a file is passed as argument, all d.ts files will be used that is found inside the folder and it's subfolders.

If no folder or file is passed in as argument, then all d.ts files will be send through the cleanDts function that is in the folder from which cleandts is called from and it's subfolders.

#### Arguments

The available arguments are as follows:

| arg       | description                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| all       | can be --all or --all=modName. If no equal is used, the all value of the options will be set to '' or '/'.           |
| newName   | Set the newName value of the options object. Must have value! (i.e. --newName=fileName) if argument is used.         |
| newname   | Same as above                                                                                                        |
| ext       | Set the ext value of the options object. Must have value (i.e. --ext=d.ts) if arument is used.                       |
| outputDir | Set the outputDir value of the options object. Must have value (i.e. --outputDir=some/location) if argument is used. |
| outputdir | same as above                                                                                                        |
| baseExt   | Set the baseExt value of the options object. Must have value (i.e. --baseExt=d.ts) if argument is used.              |
| baseext   | same as above                                                                                                        |
| sync      | Used if clean dts should run synchronously. default is async.                                                        |

**PLEASE NOTE**: all args mentioned above should start with --. i.e. --newName=...

## Contributions

Contributions are welcome. I hope you enjoy and feel free to contact me for any advice or enhancement.
