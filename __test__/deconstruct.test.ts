import { parseCode } from '../src/lib/deconstruct';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { moduleGroup } from '../src/types/types';
const file2 = readFileSync(resolve(__dirname, 'mock/file2.txt')).toString();
const file3 = readFileSync(resolve(__dirname, 'mock/file3.txt')).toString();
const res2 = require('./mock/file2.json');
const res2a = require('./mock/file2All.json');
const res3 = require('./mock/file3.json');

function c(obj: moduleGroup): moduleGroup {
	const newObj = obj;
	Object.keys(obj).forEach(key => {
		newObj[key].code = newObj[key].code.replace(/[\r\n\t ]+/g, ' ');
	});
	return newObj;
}

describe('testing parseCode', () => {
	test('parseCode Function on file 2 without options', () => {
		expect(c(parseCode(file2))).toMatchObject(c(res2));
	});
	test('parseCode Function on file 2 with options - all = ""', () => {
		expect(c(parseCode(file2, { all: '' }))).toMatchObject(c(res2a));
	});
	test('more complex structures - file3', () => {
		expect(c(parseCode(file3))).toMatchObject(c(res3));
	});
});
