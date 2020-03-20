import { readFile, readFileSync, writeFile, writeFileSync, mkdir, mkdirSync } from 'fs';
import { parse, format, resolve } from 'path';
import { Options } from './types/types';
import { parseCode } from './lib/deconstruct';
import { reconstruct } from './lib/reconstruct';

/**
 * Wraps a call back function in a promise.
 * @param func The function to wrap in a promise
 * @param params The params to pass to the function.
 */
function promise<T>(func: (...someParms) => void, ...params): Promise<T> {
	return new Promise((res, rej) => {
		return func(...params, (err, data) => {
			if (err) return rej(err);
			return res(data.toString());
		});
	});
}
/**
 * Wraps a callback function that only utilizes error in a promise.
 * @param func The function to wrap in a promise.
 * @param params The params to pass to the function.
 */
function onlyErrorPromise(func: (...someParms) => void, ...params): Promise<void> {
	return new Promise((res, rej) => {
		return func(...params, err => {
			/* istanbul ignore next: no test case */
			if (err) rej(err);
			res();
		});
	});
}
/**
 * Make sure and alter the destination depening on what is provided by options.
 * @param location The starting location.
 * @param options Options to be added or checked against.
 */
function getDestination(location: string, options: Options): string {
	const parsed = parse(location || '');
	if (options.newName) parsed.name = options.newName;
	if (options.outputDir) parsed.dir = options.outputDir;

	if (options.ext) {
		let reg;
		/* istanbul ignore else: no else */
		if (options.baseExt) {
			reg = new RegExp(`\\.?${options.baseExt}$`);
			parsed.name = parsed.base.replace(reg, '');
		}
		parsed.ext = options.ext;
	}

	parsed.base = parsed.name + (parsed.ext.charAt(0) === '.' ? parsed.ext : `.${parsed.ext}`);

	const dir = format(parsed);
	if (dir === '.') return '';
	return resolve(dir);
}
/**
 * Extends Error and is used for customized error messages.
 * @param msg A message to dispaly in the error.
 * @param error An error object to pass through.
 */
function CleanError(msg: string, error: Error): void {
	this.msg = msg;
	this.error = error;
	this.stack = new Error().stack;
	this.name = 'cleanError';
}
/**
 * Main Synchronous function that ensure that d.ts files appear clean.
 * @param options An Options object.
 * @param text Optional text to parse through.
 */
export function cleanDtsSync(options: Options = {}, text = ''): string | void {
	let src = text;
	const opts = options == null ? {} : options;
	/* istanbul ignore else: no else */
	if (!text && opts.file) {
		try {
			src = readFileSync(opts.file).toString();
		} catch (error) {
			throw new CleanError(
				`An error has occured attempting to read file ${opts.file}.`,
				error,
			);
		}
	}

	const parsed = parseCode(src, opts);
	let result = text;
	/* istanbul ignore else: no else */
	if (parsed) {
		const res = reconstruct(parsed, opts);
		/* istanbul ignore else: no else */
		if (res) result = res;
	}
	const store = getDestination(opts.file, opts);
	/* istanbul ignore else: no else */
	if (!store) return result;
	// make sure folder exists
	const storeParse = parse(store);
	try {
		mkdirSync(storeParse.dir);
	} catch (error) {
		/* istanbul ignore next: no test case */
		if (error.code !== 'EEXIST')
			throw new CleanError(`an error occured creating folder ${storeParse.dir}`, error);
	}
	// write to file
	try {
		writeFileSync(store, result);
	} catch (error) {
		/* istanbul ignore next: no test case */
		throw new CleanError(`an error has occured attempting to write to ${store}.`, error);
	}
	// eslint-disable-next-line consistent-return, no-useless-return
	return;
}
/**
 * Main Asynchronous function that ensure that d.ts files appear clean.
 * @param opts An Options object.
 * @param text Optional text to parse through.
 */
export async function cleanDts(options: Options = {}, text = ''): Promise<string | void> {
	let src = text;
	const opts = options == null ? {} : options;
	if (!text && opts.file) {
		try {
			src = await promise<string>(readFile, opts.file);
		} catch (error) {
			return Promise.reject(
				new CleanError(`An error has occured attempting to read file ${opts.file}.`, error),
			);
		}
	}

	const parsed = parseCode(src, opts);
	let result = text;
	/* istanbul ignore else: no else */
	if (parsed) {
		const res = reconstruct(parsed, opts);
		if (res) result = res;
	}
	const store = getDestination(opts.file, opts);
	if (!store) return Promise.resolve(result);
	// make sure folder exists
	const storeParse = parse(store);
	try {
		await onlyErrorPromise(mkdir, storeParse.dir);
	} catch (error) {
		/* istanbul ignore next: no test case */
		if (error.code !== 'EEXIST')
			return Promise.reject(
				new CleanError(`an error occured creating folder ${storeParse.dir}`, error),
			);
	}
	// write to file
	try {
		await onlyErrorPromise(writeFile, store, result);
	} catch (error) {
		/* istanbul ignore next: no test case */
		Promise.reject(
			new CleanError(`an error has occured attempting to write to ${store}.`, error),
		);
	}
	return Promise.resolve();
}
