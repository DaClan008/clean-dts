import { altered, member, codeType, moduleGroup, Options, port } from '../types/types';
import { getPort, getNewName, testModule, getComment } from './helper';

let groupNumber = 0;

enum Location {
	internal,
	exports,
	imports,
	importArr,
	ExportArr,
}

function getGroupID(name: string): string {
	/* istanbul ignore next */
	const nme = name || 'none';
	return nme + (++groupNumber).toString();
}

/**
 * Returns an object with a name value
 * @param code The code to get a functionary name from
 * @param indx The starting index to get a name from in the code.
 * @returns {nameResult}
 */
function getName(code: string, indx: number): nameResult {
	const result: nameResult = {
		name: '',
		full: '',
		pre: '',
	};
	let i = indx;
	let space = '';
	const len = code.length;
	while (i < len && /\{|\(|=|;|:/.test(code[i]) === false) {
		if (/\s/.test(code[i])) space += code[i];
		else {
			if (space) {
				result.pre += result.name + space;
				result.full += space;
				result.name = '';
				space = '';
			}
			result.name += code[i];
			result.full += code[i];
		}
		i++;
	}
	if (code[i] === '(') result.codeType = codeType.roundBracket;
	if (code[i] === '{') result.codeType = codeType.curlyBracket;
	if (code[i] === '=') result.codeType = codeType.equal;
	if (result.codeType != null) result.full += `${space}${code[i]}`;
	return result;
}
/**
 * Get all the values for the export items in a moduleGroup.
 * @param {moduleGroup} modGroup The moduleGroup to work in.
 * @returns {moduleGroup}
 */
function getExportValues(modGroup: moduleGroup): moduleGroup {
	const result = modGroup;
	const keys = Object.keys(modGroup);
	let counter = 0;

	const getExport = (name: string, from: string): false | altered => {
		counter++;
		const mod = modGroup[from];
		if (!mod || counter > 15) return false;

		// see if it is in internals
		if (mod.internals[name]) return mod.internals[name];
		// look in exports
		if (mod.exports[name]) {
			const nme = mod.exports[name].name;
			if (!mod.exports[name].from) {
				// see if another internal
				if (nme !== name && mod.internals[nme]) return mod.internals[nme];
				// else we won't find it in internal... look at imports
				if (mod.imports[nme]) {
					/* istanbul ignore next */
					if (mod.imports[nme].value != null) return mod.imports[nme].value;
					result[from].imports[nme].value = getExport(
						mod.imports[nme].name,
						mod.imports[nme].from,
					);
					return result[from].imports[nme].value;
				}
				// else look at import * from or export * from
				/* istanbul ignore next */
				let arr = mod.exportStr || [];
				/* istanbul ignore else */
				if (mod.importStr) arr.push(...mod.importStr);
				arr = arr.filter((val, indx, array) => array.indexOf(val) === indx);
				for (let i = 0, len = arr.length; i < len; i++) {
					const res = getExport(nme, arr[i]);
					if (res) return res;
				}
			} else return getExport(nme, mod.exports[name].from);
		}
		return false;
	};

	keys.forEach(key => {
		// find values
		const mod = modGroup[key];
		const exportKeys = Object.keys(mod.exports);

		exportKeys.forEach(exprt => {
			counter = 0;
			const ex = mod.exports[exprt];
			if (!ex.all) result[key].exports[exprt].value = getExport(exprt, key);
		});
	});
	return result;
}

function rename(modGroup: moduleGroup, options: Options): moduleGroup {
	const result = modGroup;
	const keys = Object.keys(modGroup);
	if (options.all != null) return result;

	const amend = (val: altered): void => {
		/* istanbul ignore else */
		if (val.owner) result[val.owner].used = true;
		/* istanbul ignore else */
		if (result[val.owner].internals[val.name])
			result[val.owner].internals[val.name].used = true;
	};

	const alter = (code: string, key: string): void => {
		let c = code;
		const replaceReg = /\n--replace(.*?)=(.*)?\[(all|grp)?(ex|im)\]/;
		/* istanbul ignore next: [] = safety check */
		const exKeys = result[key].exports ? Object.keys(result[key].exports) : [];
		while (replaceReg.test(c)) {
			const [, id, name, t] = replaceReg.exec(c);
			c = c.replace(replaceReg, '');
			/* istanbul ignore else */
			if (t === 'all') {
				/* istanbul ignore else */
				if (name) {
					/* istanbul ignore else */
					if (result[name]) result[name].allused = true;
					if (!result[key].includeArr) result[key].includeArr = [name];
					else result[key].includeArr.push(name);
				}
				continue;
			}
			exKeys.forEach(exkey => {
				const ex = result[key].exports[exkey];
				if (ex.positionID === id) {
					if (ex.value) amend(ex.value);
					else if (ex.all && ex.from && result[ex.from]) result[ex.from].allused = true;
					(result[key].exports[exkey] as altered).include = true;
				}
			});
		}
	};

	keys.forEach(key => {
		const mod = modGroup[key];
		const modReg = /(\r?\n?\r?[ \t]*)?\/\*+\s*\$mod=?\s*(['"])?(.*?)['"]?\s*\*\/\s*?(((.|\s)*?)(\/\*+\s*\$modend\s*\*\/)|((.|\s)*))?/;
		let modCode = mod.code;
		while (modReg.test(modCode)) {
			result[key].isMod = true;
			const [, , quote, name, , c1, , , c2] = modReg.exec(mod.code);
			const code = c1 || c2;
			alter(code, key);
			let nme = name.trim();
			modCode = modCode.replace(modReg, code);
			if (!quote && !nme) continue;
			nme = nme || '/';
			result[key].newName = nme;
		}
		result[key].code = modCode;
	});

	return result;
}

/**
 * Parses through the code and return a moduleGroup object.
 * @param {string} code The code to parse through.
 * @param {Options} [options] Options available for parsing through the code.
 * @returns {moduleGroup}
 * @internal
 */
export function parseCode(code: string, options: Options = {}): moduleGroup {
	const result: moduleGroup = {};
	groupNumber = 0;
	let currentName = '';
	let internal = '';
	let comment = '';
	let intCnt = 0;
	let cnt = 0;
	let { all } = options;
	let space = '';
	let extra = false;
	let extraStrt = 0;
	if (all != null) all = all || '/';

	const switchModule = (name?: string): void => {
		const nme = !name ? '/' : name;
		if (!result[nme]) {
			result[nme] = {
				name: nme,
				exports: {},
				exportStr: [],
				imports: {},
				importStr: [],
				groups: {},
				internals: {},
				code: '',
				comment,
			};
		}
		cnt = 0;
		currentName = nme;
	};
	switchModule();

	const addChar = (char: string): void => {
		if (/\s+/.test(char) && comment && char !== '') space += char;
		else {
			if (internal) result[currentName].internals[internal].code += comment + space + char;
			result[currentName].code += comment + space + char;
			comment = '';
			space = '';
		}
	};
	/**
	 * See if there are any declare values
	 * @param indx The index to get the declare section from.
	 */
	const getDeclare = (indx: number): number => {
		const declre = testModule(code, indx);
		/* istanbul ignore else */
		if (declre > 7) {
			if (currentName === '/' && !internal) {
				const name = getName(code, indx + declre + 1);
				/* istanbul ignore else */
				if (name.name) {
					currentName = name.name.replace(/['"]/g, '');
					switchModule(currentName);
					/* istanbul ignore else */
					if (name.codeType) result[currentName].type = name.codeType;
					return declre + name.full.length;
				}
			} else {
				extra = true;
				/* istanbul ignore next */
				extraStrt = internal ? intCnt : cnt;
			}
		}
		/* istanbul ignore else */
		if (declre > 0) {
			addChar('declare');
			/* istanbul ignore next */
			if (internal) result[currentName].internals[internal].hasDeclare = true;
			else result[currentName].hasDeclare = true;
			return 6;
		}
		addChar('d');
		return 0;
	};

	/** add export members to result object */
	const addMem = (props: memberAdd): void => {
		const p: member = { ...props };
		const grp = props.complex && true;

		if (grp) p.group = true;
		if (p.name === '*') p.all = true;
		if (comment) {
			/* istanbul ignore else */
			if (props.len === 1) p.comment = comment + space;
			else result[currentName].code += comment + space;
		}
		comment = '';
		space = '';

		const name = props.as || props.name;
		if (props.portType === 'im') {
			if (name && name !== '*') result[currentName].imports[name] = p;
			else result[currentName].importStr.push(p.from);
		} else if (name !== '*') result[currentName].exports[name] = p;
		else result[currentName].exportStr.push(p.from);

		// update groups property
		if (grp) {
			if (!result[currentName].groups[p.positionID])
				result[currentName].groups[p.positionID] = [name];
			else {
				result[currentName].groups[p.positionID].push(name);
				return;
			}
		}
		// update current
		result[currentName].code += `\n--replace${p.positionID}=`;
		if (grp) result[currentName].code += `${p.from}[grp`;
		else if (name && name !== '*') result[currentName].code += `${name}[`;
		/* istanbul ignore else */ else if (
			(name === '*' || (!name && props.portType === 'im')) &&
			props.from
		) {
			result[currentName].code += `${p.from}[all`;
		}
		result[currentName].code += `${props.portType}]`;
	};

	/**
	 * See if we have an import or export value.  If true, then see if it is internal.
	 * @param indx The index to start testing from;
	 */
	const portTest = (indx: number): number => {
		const portProp = getPort(code, indx);
		if (portProp) {
			if (portProp === true) {
				// add internal export (i.e. not export {} or import but i.e. export function)
				const name = getName(code, indx + 6);
				/* istanbul ignore else */
				if (name.name) {
					result[currentName].internals[name.name] = {
						owner: currentName,
						name: name.name,
						type: name.codeType,
						comment,
						prename: name.pre,
						portType: 'ex',
						code: name.codeType === codeType.roundBracket ? '(' : '',
					};
					internal = name.name;
					if (space) {
						result[currentName].internals[internal].comment += space;
						result[currentName].code += comment + space;
						comment = '';
						space = '';
					}
					result[currentName].code += `${comment}export${name.full}`;
					comment = '';
					return 6 + name.full.length - 1;
				}
				/* istanbul ignore next */
				return 0;
			}
			const prop: memberAdd = { ...portProp.member, positionID: getGroupID(currentName) };
			if (portProp.member.complex) {
				const cplxSplit = portProp.member.complex.split(',');
				const cplxLen = cplxSplit.length;
				cplxSplit.forEach(c => addMem({ ...prop, ...getNewName(c), len: cplxLen }));
			} else if (portProp.member.name) addMem({ ...prop, len: 1 });
			else addMem({ ...prop, len: 0 });
			return Math.max(portProp.str.length - 1, 0);
		}
		return 0;
	};

	for (let i = 0, len = code.length; i < len; i++) {
		const char = code[i];
		switch (char) {
			case '(':
			// break omitted
			case '{':
				if (internal) intCnt++;
				else cnt++;
				addChar(char);
				break;
			case ')':
				if (internal) intCnt--;
				else cnt--;
				addChar(char);
				break;
			case '}':
				if (internal) intCnt--;
				else cnt--;
			// break omitted
			case ';':
				if (extra) {
					/* istanbul ignore next */
					if (internal && extraStrt === intCnt) extra = false;
					else if (!internal && extraStrt === cnt) extra = false;
				}
				if (internal) {
					if (
						intCnt < 0 ||
						result[currentName].internals[internal].type == null ||
						(result[currentName].internals[internal].type !== codeType.curlyBracket &&
							intCnt === 0)
					) {
						if (result[currentName].internals[internal].type !== codeType.curlyBracket)
							result[currentName].internals[internal].code += char;
						internal = '';
						intCnt = 0;
					}
					addChar(char);
				} else if (cnt < 0 || result[currentName].type === codeType.equal) {
					switchModule();
				} else addChar(char);
				break;
			case '/':
				if (comment) addChar('');
				// eslint-disable-next-line no-case-declarations
				const c = getComment(code, i);
				if (c.length === 1) addChar('/');
				if (c.length > 1) {
					i += c.length - 1;
					if (/\/\*\*\s*\$mod(end|=|\s*\*\/)/.test(c)) addChar(c);
					else comment = c;
				}
				break;
			case 'd':
				if (extra) addChar(char);
				else i += getDeclare(i);
				comment = '';
				break;
			case 'i':
			// break omitted
			case 'e':
				if (all || internal || extra) addChar(char);
				else {
					const test = portTest(i);
					if (test === 0) addChar(char);
					else i += test;
				}
				break;
			default:
				addChar(char);
				break;
		}
	}
	return rename(getExportValues(result), options);
}

type memberAdd = port & {
	positionID: string;
	len?: number;
	comment?: string;
};

type memberAddResult = {
	/** The member to add */
	mem?: member;
	/** The location to add the member to. */
	location?: Location;
};

type nameResult = {
	name: string;
	full: string;
	pre: string;
	codeType?: codeType;
};
