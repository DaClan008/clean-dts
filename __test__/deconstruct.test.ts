import { parseCode } from '../src/lib/deconstruct';
import { resolve } from 'path';
import { readFileSync } from 'fs';
const file2 = readFileSync(resolve(__dirname, 'mock/file2.txt')).toString();
const file3 = readFileSync(resolve(__dirname, 'mock/file3.txt')).toString();
const res2 = require('./mock/file2.json');
const res2a = require('./mock/file2All.json');
const res3 = require('./mock/file3.json');

describe('testing parseCode', () => {
	test('parseCode Function on file 2 without options', () => {
		expect(parseCode(file2)).toMatchObject(res2);
	});
	test('parseCode Function on file 2 with options - all = ""', () => {
		expect(parseCode(file2, { all: '' })).toMatchObject(res2a);
	});
	test('more complex structures - file3', () => {
		expect(parseCode(file3)).toMatchObject(res3);
	});
});
