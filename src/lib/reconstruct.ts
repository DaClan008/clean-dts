import { lstat } from 'fs';
// eslint-disable-next-line object-curly-newline
import {
	moduleGroup,
	Options,
	Strategies,
	altered,
	member,
	codeType,
	members,
	// eslint-disable-next-line object-curly-newline
} from '../types/types';

function getCode(mod: altered, modules: moduleGroup, incl = false): string | false {
	if (!mod) return false;
	let c = mod.code;
	const reg = /\s*?([ \t]+)?\n--replace([^\s]*?)=(.*?)\[(all|grp)?(im|ex)\]/;
	const importGrp: grpObj = {};
	let grpNames: { [key: string]: string[] } = {};
	const exportChk: string[] = [];

	/* istanbul ignore next: can't hit */
	const addImport = (from: string, mbr: member): void => {
		if (!importGrp[from]) importGrp[from] = [mbr];
		else importGrp[from].push(mbr);
	};
	const addGrp = (name: string, from: string): void => {
		/* istanbul ignore if: can't hit */
		if (grpNames[from]) grpNames[from].push(name);
		else grpNames[from] = [name];
	};
	const listToString = (mem: members, val: string[]): string => {
		if (mem == null) return val.join(', ');
		let tmpText = '';
		val.forEach(nme => {
			if (tmpText !== '') tmpText += ', ';
			if (mem[nme] && mem[nme].as) {
				tmpText += `${mem[nme].name} as `;
			}
			tmpText += nme;
		});
		return tmpText;
	};

	const getGrp = (): string => {
		let res = '';
		const keys = Object.keys(grpNames);
		keys.forEach(key => {
			const txt = listToString(mod.exports, grpNames[key]);
			// grpNames[key].join(', ')
			res += `export { ${txt} }`;
			if (key) res += ` from '${key}'`;
			res += ';';
		});
		return `${res}\n`;
	};
	const addMember = (mbr: member): string => {
		let result = '';
		const nme = mbr.as || mbr.name;
		let { comment = '' } = mbr;
		const { portType } = mbr;
		/* istanbul ignore if: prevent duplicated members */
		if (exportChk.indexOf(nme) > -1) return '';
		if (mbr.all) {
			const frm = mbr.from;
			/* istanbul ignore if: Don't think it will ever be hit */
			if (!modules[frm] || !mbr.include) {
				result = `${comment}${portType}port *${mbr.as ? ` as ${nme}` : ''} from ${frm};`;
			} /* istanbul ignore else */ else if (mbr.include) {
				const code = getCode(modules[frm], modules, true);
				/* istanbul ignore else: no else */
				if (code) {
					/* istanbul ignore else: no use case yet */
					if (mbr.as) {
						result = `${comment}${portType}port namespace ${mbr.as} {${code}}`;
					} else result = code;
				}
			}
		} else if (mbr.value) {
			if (mbr.value.comment) comment = mbr.value.comment;
			result = `${comment}${mbr.portType}port${mbr.value.prename.replace(/^\s*default/, '')}`;
			result = `${result.trimRight()} ${nme}`;
			if (mbr.value.type === codeType.curlyBracket) result += `{${mbr.value.code}}`;
			else result += mbr.value.code;
		} /* istanbul ignore else: no else */ else if (
			nme &&
			nme !== '*' &&
			mbr.portType === 'ex'
		) {
			result += `export ${mbr.name} from '${mbr.from}';`;
		}
		/* istanbul ignore else: no else */
		if (nme !== '*') exportChk.push(nme);

		return result;
	};
	const replace = (res: string): void => {
		if (res) c = c.replace(/\n--replace([^\s]*?)=(.*?)\[(all|grp)?(im|ex)\]/, res);
		else c = c.replace(/\s*--replace([^\s]*?)=(.*?)\[(all|grp)?(im|ex)\]/, '');
	};

	while (reg.test(c)) {
		let result = '';
		const [, space, id, name, t, port] = reg.exec(c);
		grpNames = {};

		if (t === 'all') {
			if (port === 'im') result += `import '${name}';`;
			else {
				const newMod = modules[name];
				/* istanbul ignore else: no else */
				if (mod.includeArr && mod.includeArr.indexOf(name) > -1) {
					const res = getCode(newMod, modules, true);
					if (res) {
						/* istanbul ignore next: clearing off whitespace at start */
						result += /^[ \t]*\n/.test(res) ? res.replace(/^[ \t]*\n/, '') : res;
						replace(result);
						continue;
					}
				}
				/* istanbul ignore if: not hit */
				if (newMod && newMod.newName) result += `export * from '${newMod.newName}'`;
				else result += `export * from '${name}';`;
			}
		} else if (t === 'grp') {
			// get group
			const grp = mod.groups[id];
			if (port === 'im') {
				if (name && !modules[name]) {
					const tmpText = listToString(mod.imports, grp);
					// grp.forEach(nme => {
					// 	if (tmpText !== '') tmpText += ', ';
					// 	if (mod.imports[nme] && mod.imports[nme].as) {
					// 		tmpText += `${mod.imports[nme].name} as `;
					// 	}
					// 	tmpText += nme;
					// });
					// grp.join(',')
					result += `import { ${tmpText} } from '${name}';`;
				}
			} else {
				grp.forEach(exName => {
					if (
						!mod.exports[exName] ||
						(mod.exports[exName] &&
							!(mod.exports[exName] as altered).include &&
							!incl) ||
						(mod.exports[exName] && mod.exports[exName].value === false)
					) {
						/* istanbul ignore else: can't hit */
						if (mod.exports[exName]) {
							const nme = exName;
							addGrp(exName, mod.exports[exName].from);
						} else if (mod.imports[exName])
							addImport(mod.imports[exName].from, mod.imports[exName]);
					} else {
						const itm = mod.exports[exName];
						const res = addMember(itm);
						/* istanbul ignore else: no else */
						if (res) result += res;
					}
				});
				result = getGrp() + space + result;
			}
		} /* istanbul ignore else */ else if (mod.exports[name]) {
			result = addMember(mod.exports[name]);
		} else if (mod.imports[name]) {
			addImport(mod.imports[name].from, mod.imports[name]);
		}

		replace(result);
	}

	// add imports
	const keys = Object.keys(importGrp);
	/* istanbul ignore if: can't hit */
	if (keys.length > 0) {
		keys.forEach(key => {
			const lst: string[] = [];
			importGrp[key].forEach(imprt => {
				if (imprt.include) lst.push(imprt.as ? `${imprt.name} as ${imprt.as}` : imprt.name);
			});
			if (lstat.length > 0) c = `import { ${lst.join(',')} } from ${key};`;
		});
	}
	return c;
}

function mustUse(mod: altered, options: Options): boolean {
	const strat = options.storeStrategy ? options.storeStrategy : Strategies.none;
	if (mod.done) return false;
	if (options.restrict && !mod.isMod) return false;
	if (strat === Strategies.keepAll || (!mod.allused && !mod.used) || mod.done) return true;
	if (mod.isMod || (mod.hasDeclare && !mod.allused)) return true;
	if (strat === Strategies.none && (mod.used || mod.allused)) return false;
	/* istanbul ignore else: no else */
	if (mod.allused) return false;
	/* istanbul ignore next */
	if (strat !== Strategies.keepPartial) return false;
	/* istanbul ignore next */
	return true;
}

function cleanup(code: string, mods: string[]): string {
	let result = code;
	const imprts: string[] = [];
	const exprts: string[] = [];
	const reg = /([ \t]*\/\*.*?\*\/\s*?)?([ \t]*)(im|ex)port *((({(.*?)}|(\*( *as *.*?)?)) ) *from )?['"](.*?)['"];[ \t]*[\n\r]*/;
	while (reg.test(result)) {
		const [main, comment, space, port, , , , complx, , , name, end] = reg.exec(result);
		result = result.replace(reg, '');
		if (mods.indexOf(name) === -1) {
			/* istanbul ignore else: not certain when else will be hit if at all */
			if (port === 'im') imprts.push(main);
			else exprts.push(main);
		} else if (port === 'ex' && complx) {
			const cSplit = complx.split(',');
			let str = '';
			cSplit.forEach(c => {
				if (/.*? *as *.*?/.test(c)) {
					/* istanbul ignore if: no need to test */
					if (str) str += ',';
					str += c;
				}
			});
			if (str) {
				str = `${comment || ''}${space}${port}port {${str}}`;
				/* istanbul ignore if */
				if (name && mods.indexOf(name) === -1) str += ` from '${name}'`;
				str += `;${end || ''}`;
				exprts.push(str);
			}
		}
	}
	const reg2 = /[ \t]*(im|ex)port *[^ {}]*? *from *['"](.*)['"];[ \t]*[\r\n]*/;
	while (reg2.test(result)) {
		const [main, port, name] = reg2.exec(result);
		/* istanbul ignore if: not sure when it will be run - just for safety */
		if (mods.indexOf(name) === -1) {
			if (port === 'ex') exprts.push(main);
			else imprts.push(main);
		}
		result = result.replace(reg2, '');
	}
	imprts.forEach(x => {
		result = x + result;
	});
	exprts.forEach(x => {
		result += x;
	});
	result = result.replace(reg2, '');
	return result;
}

function getName(name: string): string {
	if (/[ \\\-/+=*~]/.test(name.trim())) return `'${name.trim()}'`;
	return name;
}
/**
 * Reconstruct (back to string) a moduleGroup object.
 * @param {moduleGroup} modules A modules (moduleGroup) object to use to reconstruct a definition file.
 * @param {Options} [options] The available options for reconstruction.
 * @returns {string}
 * @internal
 */
export function reconstruct(modules: moduleGroup, options: Options = {}): string {
	let result = '';
	const mods = { ...modules };
	const all = options.mod ? undefined : options.all === '' ? '/' : options.all;
	const keys = Object.keys(mods);

	const clearText = (txt: string): string => {
		if (/[^\s]/.test(txt)) return txt;
		return '';
	};

	const getCodeCheck = (mod: altered, key: string): string => {
		if (
			mod.newName &&
			mods[mod.newName] &&
			(mods[mod.newName].newName === mod.newName || mods[mod.newName].done)
		)
			return ''; // will be dealt with when main mod is called.
		let code = getCode(mod, mods);
		/* istanbul ignore else: not sure when code will be false (safety) */
		if (code) mods[key].done = true;
		else code = '';
		code = clearText(code);
		for (let i = 0, len = keys.length; i < len; i++) {
			if (keys[i] === key) continue;
			if (
				mods[keys[i]].newName === key ||
				(mod.newName && mod.newName === mods[keys[i]].newName)
			) {
				const c = getCode(mods[keys[i]], mods);
				/* istanbul ignore else */
				if (c) {
					code += clearText(c);
					mods[keys[i]].done = true;
				}
			}
		}

		return code;
	};

	for (let i = 0, len = keys.length; i < len; i++) {
		const mod = mods[keys[i]];
		if (mustUse(mod, options)) {
			const code = getCodeCheck(mod, keys[i]);
			/* istanbul ignore else */
			if (code && /\s?.\s?/.test(code)) {
				if (all == null) {
					const nme = mod.newName || mod.name;
					if (nme === '' || nme === '/') result += code;
					else result += `declare module ${getName(mod.newName || mod.name)} {${code}}\n`;
				} else result += `${code}\n`;
			}
		}
	}
	if (all) {
		result = cleanup(result, Object.keys(mods));
	}
	if (all && all !== '/') result = `declare module ${getName(all)} {${result}}`;

	// return result
	return result;
}

type grpObj = {
	[key: string]: member[];
};
