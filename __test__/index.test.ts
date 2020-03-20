import { cleanDtsSync, cleanDts } from '../src/index';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Options } from '../src/types/types';
import * as rimraf from 'rimraf';

describe('testing synchronous code', () => {
	afterEach(async () => {
		await new Promise(res => {
			rimraf('./__test__/bin', () => res());
		});
	});
	test('use no parameters should return empty string', () => {
		const result = cleanDtsSync();

		expect(result).toEqual('');
	});
	test('use only text and no options', () => {
		const file2 = readFileSync(resolve(__dirname, 'mock/file2.txt')).toString();
		const result = cleanDtsSync(null, file2);
		const file2Result = readFileSync(resolve(__dirname, 'mock/file2dts.txt')).toString();

		expect(result).toEqual(file2Result);
	});
	test('use file location and destination root', () => {
		const options: Options = {
			file: '__test__/mock/file2.txt',
			outputDir: '__test__/bin',
			newName: 'f2',
		};
		const result = cleanDtsSync(options);
		expect(result).toBeFalsy();
		expect(existsSync(resolve('__test__/bin', 'f2.txt'))).toBe(true);
	});
	test('non-existant file', () => {
		const options: Options = {
			file: '__test__/mock/myfile.txt',
			outputDir: '__test__/bin',
			newName: 'f2',
		};
		try {
			cleanDtsSync(options);
			const a = 1;
			expect(a).toBeFalsy();
		} catch (error) {
			expect(error.msg).toBe(
				'An error has occured attempting to read file __test__/mock/myfile.txt.',
			);
			expect(existsSync(resolve('__test__/bin', 'f2.txt'))).toBe(false);
		}
	});
});

describe('testing synchronous code', () => {
	afterEach(async () => {
		await new Promise(res => {
			rimraf('./__test__/bin', () => res());
		});
	});
	test('use no parameters should return empty string', async () => {
		const result = await cleanDts();

		expect(result).toEqual('');
	});
	test('use only text and no options', async () => {
		const file2 = readFileSync(resolve(__dirname, 'mock/file2.txt')).toString();
		const result = await cleanDts(null, file2);
		const file2Result = readFileSync(resolve(__dirname, 'mock/file2dts.txt')).toString();

		expect(result).toEqual(file2Result);
	});
	test('use file location and destination root', async () => {
		const options: Options = {
			file: '__test__/mock/file.funy.ext',
			outputDir: '__test__/bin',
			baseExt: 'funy.ext',
			ext: 'txt',
		};
		const result = await cleanDts(options);
		expect(result).toBeFalsy();
		expect(existsSync(resolve('__test__/bin', 'file.txt'))).toBe(true);
	});
	test('non-existant file', async () => {
		const options: Options = {
			file: '__test__/mock/myfile.txt',
			outputDir: '__test__/bin',
			newName: 'f2',
		};
		try {
			await cleanDts(options);
			const a = 1;
			expect(a).toBeFalsy();
		} catch (error) {
			expect(error.msg).toBe(
				'An error has occured attempting to read file __test__/mock/myfile.txt.',
			);
			expect(existsSync(resolve('__test__/bin', 'f2.txt'))).toBe(false);
		}
	});
});
