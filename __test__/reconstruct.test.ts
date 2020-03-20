import { reconstruct } from '../src/lib/reconstruct';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { altered, moduleGroup, Strategies } from '../src/types/types';

const file2 = require('./mock/file2.json');
const file2All = require('./mock/file2All.json');
const file2AllName = require('./mock/file2AllName.json');
const file3 = require('./mock/file3.json');
const file3b = require('./mock/file3b.json');
const file4 = require('./mock/file4.json');
const file4b = require('./mock/file4b.json');

const file2DTS = readFileSync(resolve(__dirname, 'mock/file2dts.txt')).toString();
const file2AllDts = readFileSync(resolve(__dirname, 'mock/file2Alldts.txt')).toString();
const file2AllNameDts = readFileSync(resolve(__dirname, 'mock/file2AllNamedts.txt')).toString();
const file3DTS = readFileSync(resolve(__dirname, 'mock/file3dts.txt')).toString();
const file3bDTS = readFileSync(resolve(__dirname, 'mock/file3bdts.txt')).toString();
const file4DTS = readFileSync(resolve(__dirname, 'mock/file4dts.txt')).toString();
const file4bDTS = readFileSync(resolve(__dirname, 'mock/file4bdts.txt')).toString();

function c(val: string) {
	return val.replace(/[\n\r\t ]+/g, ' ');
}

describe('testing reconstruction', () => {
	function clear(obj: moduleGroup) {
		const keys = Object.keys(obj);
		keys.forEach(key => {
			if (obj[key].done) delete obj[key].done;
		});
	}
	test('reconstruct function on file 2', () => {
		expect(reconstruct(c(file2))).toEqual(c(file2DTS));
		clear(file2);
	});
	test('reconstruct function on file 2 All', () => {
		expect(c(reconstruct(file2All, { all: '/' }))).toEqual(c(file2AllDts));
		clear(file2All);
	});
	test('reconstruct function on file 2 All', () => {
		const result = reconstruct(file2All, { all: '' });
		expect(a(result)).toEqual(c(file2AllDts));
		clear(file2All);
	});
	test('reconstruct function on file 2 All name', () => {
		const result = reconstruct(file2AllName, { all: 'someName' });
		expect(c(result)).toEqual(c(file2AllNameDts));
		clear(file2AllName);
	});
	test('reconstruct function on file 3', () => {
		expect(c(reconstruct(file3))).toEqual(c(file3DTS));
		clear(file3);
	});
	test('reconstruct function on file 3b (more than one module same name)', () => {
		expect(c(reconstruct(file3b))).toEqual(c(file3bDTS));
		clear(file3b);
	});
	test('reconstruct function on file 4 (StoreStrategy: keepAll)', () => {
		expect(c(reconstruct(file4, { storeStrategy: Strategies.keepAll }))).toEqual(c(file4DTS));
		clear(file4);
	});
	test('reconstruct function on file 4 (StoreStrategy: keepPartial)', () => {
		expect(c(reconstruct(file4b, { storeStrategy: Strategies.keepPartial }))).toEqual(
			c(file4bDTS),
		);
		clear(file4b);
	});
});
