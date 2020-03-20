/**
 * The available options for Clean Dts
 */
export type Options = {
	/**
	 * Determmine how the modules should be stored if imported by other modules.
	 */
	storeStrategy?: Strategies;
	/** Change all module names to the value provided here */
	all?: string;
	/** The file to parse through (name and location) */
	file?: string;
	/** change Name (only name not location) */
	newName?: string;
	/** add extension type */
	ext?: string;
	/** the output location (only directory not name) */
	outputDir?: string;
	/** base Extension */
	baseExt?: string;
};
/* @internal */
export type port = {
	portType: string;
	complex?: string;
	name?: string;
	as?: string;
	from?: string;
};
/* @internal */
export type testResult = {
	member: port;
	str: string;
};
/* @internal */
export type member = {
	positionID: string;
	name?: string;
	as?: string;
	from?: string;
	comment?: string;
	portType: string;
	all?: boolean;
	group?: boolean;
	value?: altered | false;
	include?: boolean;
};
/* @internal */
export type members = {
	[key: string]: member;
};
/* @internal */
export type memberGroup = {
	[key: string]: string[];
};
/* @internal */
export type codeBlock = {
	comment?: string;
	prePort?: string;
	portType?: string;
	default?: boolean;
	prename?: string;
	remain?: string;
	name?: string;
	code?: string;
	hasDeclare?: boolean;
	type?: codeType;
	exports?: members;
	imports?: members;
	/** reserved for 'import "somefile";'  No name */
	importStr?: string[];
	/** reserved for 'export * from "somefile";' No name */
	exportStr?: string[];
	groups?: memberGroup;
};
/* @internal */
export type altered = codeBlock & {
	owner?: string;
	newName?: string;
	internals?: internals;
	used?: boolean;
	allused?: boolean;
	include?: boolean;
	includeArr?: string[];
	exportInclude?: boolean;
	isMod?: boolean;
	done?: boolean;
};
/* @internal */
export type moduleGroup = {
	[key: string]: altered;
};
/* @internal */
export type internals = {
	[key: string]: altered;
};
/* @internal */
export enum codeType {
	equal,
	roundBracket,
	curlyBracket,
}

export enum Strategies {
	/** Remove modules which are referenced from main */
	none,
	/**
	 * Only keep modules which was partially imported into other modules.
	 * If all exports were imported then module will be removed, unless
	 * there are declared variables.
	 */
	keepPartial,
	/**
	 * Will keep all modules.
	 */
	keepAll,
}
