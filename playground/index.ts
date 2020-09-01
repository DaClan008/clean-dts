import { parseCode } from '../src/lib/deconstruct';
import { reconstruct } from '../src/lib/reconstruct';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { Strategies } from '../src/types/types';
import { cleanDtsCli } from '../src/cli/cleanDTScli';

const DTS = true;

const folder = './__test__/mock/';
const ext = '.txt';
// const folder = './playground/';
// const ext = '.d.ts';

function createFiles(fileName, options = {}, storeName = '') {
	const file = readFileSync(resolve(`${folder}${fileName}${ext}`)).toString();
	const val = parseCode(file, options);
	let store = storeName || fileName;
	if (DTS) {
		const code = val ? reconstruct(val, options) : '';
		writeFileSync(resolve(`${folder}${store}dts.txt`), code);
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
	if (val) writeFileSync(resolve(`${folder}${store}.json`), JSON.stringify(val, null, 4));
}

createFiles('file2');
createFiles('file2', { all: '/' }, 'file2All');
createFiles('file2', { all: 'someName' }, 'file2AllName');
createFiles('file3');
createFiles('file3b');
createFiles('file4', { storeStrategy: Strategies.keepAll });
createFiles('file4', { storeStrategy: Strategies.keepPartial }, 'file4b');
createFiles('file5', { mod: ['index', 'lib/d1:index'], all: 'some', restrict: true });
createFiles('file5', { mod: ['index:', 'lib/d1:index'] }, 'file5b');

// const options = {
// 	mod: 'index',
// 	all: 'to-table',
// 	restrict: true,
// 	newName: 'index2',
// 	excludeProtected: true,
// };

// createFiles('index', options, 'index2');
