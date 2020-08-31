import { testResult, port } from '../types/types';

/**
 * Get export or import members
 * @param code The code to get export/import members from
 * @param start The starting position of the export/import members
 * @returns {testResult|false|string} Return true if internal export detected.
 * @internal
 * Returns false if not member nor import and export type, else return testResult.
 */
export function getPort(code: string, start: number): testResult | boolean {
	let portType = '';
	let complex = '';
	let from = '';
	let name = '';
	let newName = '';
	let asActive = false;
	let fromActive = false;
	const len = code.length;

	portType = code[start];
	if (code[start + 1] !== 'm' && code[start + 1] !== 'x') return false;
	portType += code[start + 1];
	/* istanbul ignore next */
	if (code.substr(start + 2, 5) !== 'port ') return false;

	const getSection = (indx: number, end: string): string => {
		let ind = indx;
		let wrd = code[indx];
		const reg = new RegExp(`${end}|;|\\(|\\{|=`);
		while (++ind < len && !reg.test(code[ind])) wrd += code[ind];
		return wrd;
	};

	let current = `${portType}port`;
	for (let i = start + 6; i < len; i++) {
		const char = code[i];
		current += char;
		if (!/\s/.test(char)) {
			if (char === '{') {
				/* istanbul ignore next - general safety check */
				if (name || from || asActive || fromActive || complex) return true;
				complex = getSection(i + 1, '}');
				current += `${complex}}`;
				i += complex.length + 1;
				// remove unwatned characters
				complex = complex.replace(/\n\r\t\f\v/g, ' ');
				// remove duplicate spaces
				complex = complex.replace(/ +/g, ' ');
			} else if (char === '"' || char === "'") {
				from = getSection(i + 1, char);
				current += from + char;
				i += from.length + 1;
			} else if (char === ';') i = len;
			else {
				const wrd = getSection(i, '\\s');
				if (wrd === 'from') fromActive = true;
				else if (wrd === 'as') asActive = true;
				else if (!name) name = wrd;
				else if (asActive) newName = wrd;
				/* istanbul ignore next - only occur if no '|" was used */ else if (fromActive)
					from = wrd;
				else return true;
				if (wrd !== 'from') fromActive = false;
				if (wrd !== 'as') asActive = false;
				current += wrd.substr(1);
				i += wrd.length - 1;
			}
		} else if (from && /\n|\r/.test(char)) i = len;
	}
	const member: port = {
		from,
		name,
		as: newName,
		portType,
		complex,
	};
	/* istanbul ignore next - general sanity check 'export unknown' */
	if (!member.from && !member.complex) return true;
	return { member, str: current };
}
/**
 * Get a comment block.
 * @param {string} code The code to get comment from
 * @param {number} start The starting index of the comment (/ char)
 * @returns {string}
 * @internal
 */
export function getComment(code: string, start: number): string {
	let result = '/';
	if (code[start + 1] === '*') result += '*';
	else if (code[start + 1] === '/') result += '/';
	if (result.length === 1) return result;
	let i = start + 2;
	const endofline = result === '//';
	let star = false;
	for (const len = code.length; i < len; i++) {
		const char = code[i];
		if (char === '*') star = true;
		else if (char === '/' && star) return `${result}*/`;
		else if (char === '\n' && endofline) {
			/* istanbul ignore if - will most likely never happen */
			if (code[i + 1] === '\r') return `${result}\n\r`;
			return `${result}\n`;
		} else {
			if (star) result += '*';
			star = false;
			result += char;
		}
	}
	/* istanbul ignore next */
	return result;
}
/**
 * Test to see if code starting at a specific point is a 'declare module' type.
 * @param code The code to test modules against.
 * @param start The starting index in the code.
 * @returns {number} The number of characters that match.
 * @internal
 */
export function testModule(code: string, start: number): number {
	let i = start;
	const len = code.length;
	let str = '';
	let spaces = '';
	let result = '';

	for (; i < len; i++) {
		const char = code[i];
		if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
			if (str) {
				switch (str) {
					case 'declare':
						result = 'declare';
						str = '';
						spaces = char;
						break;
					case 'module':
						result += `${spaces}module`;
						return result.length;
					default:
						return result.length;
				}
			} else spaces += char;
		} else str += char;
	}
	/* istanbul ignore next: will probably never be hit - safety */
	return 0;
}
/** @internal */
export function getNewName(nameAs: string): { name: string; as?: string } {
	/* istanbul ignore if - general safety */
	if (!nameAs) return { name: nameAs };
	const [, name, , newName] = /(\*|\w+)( *as *(\w+))?/.exec(nameAs);
	return { name, as: newName };
}
