import { parseCode } from '../src/lib/deconstruct';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { moduleGroup, altered, members } from '../src/types/types';
const file2 = readFileSync(resolve(__dirname, 'mock/file2.txt')).toString();
const file3 = readFileSync(resolve(__dirname, 'mock/file3.txt')).toString();
const file5 = readFileSync(resolve(__dirname, 'mock/file5.txt')).toString();
const res2 = require('./mock/file2.json');
const res2a = require('./mock/file2All.json');
const res3 = require('./mock/file3.json');
const res5 = require('./mock/file5.json');
const res5b = require('./mock/file5b.json');

function cleanObj(obj: any): any {
	const newObj = obj;
	if (!obj) return obj;
	if (newObj.code) newObj.code = newObj.code.replace(/[\n\r\t ]+/g, ' ');
	if (newObj.comment) newObj.comment = newObj.comment.replace(/[\r\n\t ]+/g, ' ');
	return newObj;
}

function cleanEx(obj: members): members {
	const newObj = cleanObj(obj);
	Object.keys(obj).forEach(key => {
		newObj[key] = cleanObj(newObj[key]);
		if (newObj[key].value) newObj[key].value = cleanObj(newObj[key].value);
	});
	return newObj;
}

function c(obj: moduleGroup): moduleGroup {
	const newObj = obj;
	Object.keys(obj).forEach(key => {
		newObj[key] = cleanObj(newObj[key]);
		// value
		if (newObj[key].exports) newObj[key].exports = cleanEx(newObj[key].exports);
		if (newObj[key].imports) newObj[key].imports = cleanEx(newObj[key].imports);
		if (newObj[key].internals)
			newObj[key].internals = cleanEx(newObj[key].internals as members);
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
	test('mod option deconstruct with restrict option', () => {
		const options = { mod: ['index', 'lib/d1:index'], all: 'some', restrict: true };
		expect(c(parseCode(file5, options))).toMatchObject(c(res5));
	});
	test('mod option deconstruct without restrict option', () => {
		const options = { mod: ['index:', 'lib/d1:index'] };
		expect(c(parseCode(file5, options))).toMatchObject(c(res5b));
	});
});
