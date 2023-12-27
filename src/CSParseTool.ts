
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, iff, FieldType, makeFirstLetterLower, DataTable } from "export-table-lib"

export function TryConvValue(value: any, t: FieldType, f: Field): any {
	try {
		return ConvValue(value, t, f)
	} catch (ex) {
		if (ex instanceof TypeError) {
			console.error(ex)
			return null
		} else {
			return null
		}
	}
}

export function ConvValue(value: any, t: FieldType, f: Field): any {
	if (t == "object") {
		return JSON.parse(value)
	} else if (t == "object[]") {
		return JSON.parse(value)
	} else if (t == "number" || t == "float") {
		return JSON.parse(value)
	} else if (t == "int" || t == "long") {
		return parseInt(value)
	} else if (t == "number[]" || t == "float[]") {
		return JSON.parse(value)
	} else if (t == "int[]") {
		return JSON.parse(value)
	} else if (t == "long[]") {
		return JSON.parse(value)
	} else if (t == "uid") {
		return JSON.parse(value)
	} else if (t == "bool") {
		try {
			return !!JSON.parse(value)
		} catch (ex) {
			console.log(ex)
			return false
		}
	} else if (t == "bool[]") {
		return JSON.parse(value)
	} else if (t == "string") {
		return value
	} else if (t == "string[]") {
		return JSON.parse(value)
	} else if (t == "fk") {
		return value
	} else if (t == "fk[]") {
		return value
	} else if (t == "any") {
		console.log(f)
		throw new TypeError(`invalid type ${f.name}:<${f.rawType} => any>`)
	} else if (t == "key") {
		return JSON.parse(t)
	}

	throw new TypeError(`invalid unkown type ${f.name}:<${f.rawType} => ${f.type} << ${t}>`)
}

export function ConvValue2Literal(value: any, t: FieldType, f: Field): string {
	if (t == "object") {
		//throw new Error("invalid type <object>")
		let convert: string[] = [];
		for (let k in value) {
			convert.push(`{"${k}","${(value as any)[k].toString()}"}`);
		};
		return `new Dictionary<string,string>(${convert.length}){${convert}}`;
	} else if (t == "object[]") {
		let values = value as object[];
		//throw new Error("invalid type <object[]>")
		return `new List<Dictionary<string,string>>(){${values.map((val) => {
			let convert: string[] = [];
			for (let k in val) {
				convert.push(`{"${k}","${(val as any)[k].toString()}"}`);
			};
			return `new Dictionary<string,string>(${convert.length}){${convert}}`;
		})}}`
	} else if (t == "number" || t == "int" || t == "long") {
		return `${value}`
	} else if (t == "number[]") {
		let values = value as number[]
		return `new double[]{${values.join(", ")}}`
	} else if (t == "float[]") {
		let values = value as number[]
		return `new float[]{${values.join(", ")}}`
	} else if (t == "int[]") {
		let values = value as number[]
		return `new int[]{${values.join(", ")}}`
	} else if (t == "long[]") {
		let values = value as number[]
		return `new long[]{${values.join(", ")}}`
	} else if (t == "uid") {
		return `${value}`
	} else if (t == "bool") {
		return `${value}`
	} else if (t == "bool[]") {
		let values = value as boolean[]
		return `new bool[]{${values.join(", ")}}`
	} else if (t == "string") {
		// return `"${value}"`
		return JSON.stringify(value)
	} else if (t == "string[]") {
		let values = value as string[]
		return `new string[]{${values.map(v => JSON.stringify(v)).join(", ")}}`
	} else if (t == "fk") {
		return `${value}`
	} else if (t == "fk[]") {
		let values = value as number[]
		return `new int[]{${values.join(", ")}}`
	} else if (t == "any") {
		console.log(f)
		throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`)
	} else if (t == "key") {
		return `${value}`
	}

	throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`)
}

export let isSkipExportDefaults0 = process.argv.findIndex(v => v == "--SkipDefaults") >= 0

export let firstLetterUpper = function (str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};
export let firstLetterLower = function (str: string) {
	return str.charAt(0).toLowerCase() + str.slice(1);
};
export let convMemberName = function (str: string) {
	return str.split("_").map(s => firstLetterUpper(s)).join("")
}
export let convVarName = firstLetterLower

export let getFieldType = function (f: Field) {
	let t = f.type
	if (t == "object") {
		//throw new Error("invalid type <Dictionary<string,string>>")
		return "Dictionary<string,string>"
	} else if (t == "object[]") {
		//throw new Error("invalid type <Dictionary<string,string>[]>")
		return "List<Dictionary<string,string>>"
	} else if (t == "number") {
		return "double";
	} else if (t == "number[]") {
		return "double[]";
	} else if (t == "float") {
		return "float";
	} else if (t == "float[]") {
		return "float[]";
	} else if (t == "int") {
		return "int";
	} else if (t == "int[]") {
		return "int[]";
	} else if (t == "long") {
		return "long";
	} else if (t == "long[]") {
		return "long[]";
	} else if (t == "uid") {
		return "int";
	} else if (t == "bool") {
		return "bool";
	} else if (t == "bool[]") {
		return "bool[]";
	} else if (t == "string") {
		return "string";
	} else if (t == "string[]") {
		return "string[]";
	} else if (t == "fk") {
		return "int";
	} else if (t == "fk[]") {
		return "int[]";
	} else if (t == "any") {
		console.log(f)
		throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`)
	} else if (t == "key") {
		return "string";
	} else {
		throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`)
	}
	return t;
}

export let getFkFieldType = function (tables: DataTable[], field: Field) {
	return tables.find(a => a.name == field.fkTableName)!.fields!.find(a => a.name == field.fkFieldName)!.type
}

export const genValue = (value: any, f: Field): string => {
	return ConvValue2Literal(value, f.type, f)
}

export const getTitle = (v: Field) => {
	return v.describe.split("\n")[0]
}

export const getDescripts = (v: Field) => {
	return v.describe.split("\n")
}

export const convTupleArrayType = (f: Field) => {
	let line0 = f.rawType.replaceAll(/(?<=[^\w])(number)(?=[^\w]|$)/g, "double").replaceAll(/(?<=[^\w])(boolean)(?=[^\w]|$)/g, "bool");
	console.log(line0)
	let m = line0.match(/\@\((\w+),(\w+)\)(\[\])?/)
	if (m != null) {
		let type1 = m[1]
		let type2 = m[2]
		let isArray = m[3] != null
		let line = `public WritableValueTuple<${type1}, ${type2}>${isArray ? "[]" : ""} ${convMemberName(f.name)}Obj;`
		return line;
	} else {
		return `public ${line0}  ${convMemberName(f.name)}Obj;`
	}
}
