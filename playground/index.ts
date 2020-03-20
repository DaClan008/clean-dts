import { parseCode } from '../src/lib/deconstruct';
import { reconstruct } from '../src/lib/reconstruct';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { Strategies } from '../src/types/types';

const DTS = true;

function createFiles(fileName, options = {}, storeName = '') {
	const file = readFileSync(resolve(`./__test__/mock/${fileName}.txt`)).toString();
	const val = parseCode(file, options);
	let store = storeName || fileName;
	if (DTS) {
		const code = val ? reconstruct(val, options) : '';
		writeFileSync(resolve(`./__test__/mock/${store}dts.txt`), code);
	}
	Object.keys(val).forEach(key => {
		if (val[key].exports) {
			if (Object.keys(val[key].exports).length === 0) delete val[key].exports;
		}
		if (val[key].imports) {
			if (Object.keys(val[key].imports).length === 0) delete val[key].imports;
		}
		if (val[key].groups) {
			if (Object.keys(val[key].groups).length === 0) delete val[key].groups;
		}
		if (val[key].internals) {
			if (Object.keys(val[key].internals).length === 0) delete val[key].internals;
		}
		if (val[key].exportStr) {
			if (val[key].exportStr.length === 0) delete val[key].exportStr;
		}
		if (val[key].importStr) {
			if (val[key].importStr.length === 0) delete val[key].importStr;
		}
		if (val[key].done) delete val[key].done;
	});
	if (val['/']) {
		// const code = val['/'].code.replace(/\r|\n/g, '');
		// if (!code.trim()) delete val['/'].code;
		// if (!val['/'].comment) delete val['/'].comment;
		// if (Object.keys(val['/']).length === 1) delete val['/'];
	}
	if (val) writeFileSync(resolve(`./__test__/mock/${store}.json`), JSON.stringify(val, null, 4));
}

createFiles('file2');
createFiles('file2', { all: '/' }, 'file2All');
createFiles('file2', { all: 'someName' }, 'file2AllName');
createFiles('file3');
createFiles('file3b');
createFiles('file4', { storeStrategy: Strategies.keepAll });
createFiles('file4', { storeStrategy: Strategies.keepPartial }, 'file4b');
