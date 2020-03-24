import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import * as minimist from 'minimist';
import { Options, Strategies } from '../types/types';
import { cleanDtsSync, cleanDts } from '..';

/**
 * Filter through and amend files to only parse through correct files.
 * If no file is specified, or if a folder is specified, all files with d.ts (or base ext)
 * will be parsed through and saved to the same file.
 * @param files The files to filter through.
 * @param baseExt The base extension value if it exists.
 */
function filterFiles(files: string[], baseExt = ''): string[] {
	const result: string[] = [];
	if (files.length === 0) files.push(process.cwd());

	for (let i = files.length - 1; i >= 0; i--) {
		const file = resolve(files[i]);
		if (existsSync(file)) {
			// see if it is directory or file
			try {
				let dirContent = readdirSync(file);
				if (dirContent.length > 0) {
					dirContent = dirContent
						.filter(content => content !== 'node_modules')
						.map(content => {
							return resolve(file, content);
						});
					const content = filterFiles(dirContent);
					result.push(...content);
				}
			} catch (error) {
				if (error.code === 'ENOTDIR') {
					// we are dealing with files
					if (baseExt) {
						if (!new RegExp(`\\.?${baseExt}$`).test(file)) continue;
					} else if (!/\.d\.ts$/.test(files[i])) continue;
					result.push(file);
				}
			}
		}
	}
	return result;
}
/**
 * Calls the cleandts function by means of arguments passed to the console.
 * @param args The arguments that was passed to the console.
 * @internal
 */
export function cleanDtsCli(args: string[]): void | string | Promise<void | string>[] {
	const parsedArgs = minimist(args.slice(2));
	let files: string[] = parsedArgs._;
	const options: Options = {};

	if (parsedArgs.keepAll || parsedArgs.keepall) options.storeStrategy = Strategies.keepAll;
	else if (parsedArgs.keepPartial || parsedArgs.keeppartial)
		options.storeStrategy = Strategies.keepPartial;

	options.all = parsedArgs.all === true ? '' : parsedArgs.all;
	options.newName = parsedArgs.newName || parsedArgs.newname || '';
	options.ext = parsedArgs.ext || '';
	options.outputDir = parsedArgs.outputDir || parsedArgs.outputdir || '';
	options.baseExt = parsedArgs.baseExt || parsedArgs.baseext || '';
	if (parsedArgs.mod) options.mod = parsedArgs.mod.split(',');
	if (parsedArgs.restrict) options.restrict = parsedArgs.restrict;

	files = filterFiles(files, options.baseExt);
	if (files.length === 0) {
		files.push(process.cwd());
	}
	let resultStr = '';
	const resultArr: Promise<string | void>[] = [];

	files.forEach(file => {
		options.file = file;
		if (parsedArgs.sync) {
			const result = cleanDtsSync(options);
			if (result) resultStr += result;
		} else {
			resultArr.push(cleanDts(options).catch(err => console.log(err)));
		}
	});
	if (resultStr) return resultStr;
	if (resultArr.length > 0) return resultArr;
	// eslint-disable-next-line consistent-return, no-useless-return
	return;
}
