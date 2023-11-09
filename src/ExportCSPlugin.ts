
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, iff } from "export-table-lib"
import * as fs from "fs-extra"

var isSkipExportDefaults0 = process.argv.findIndex(v => v == "--SkipDefaults") >= 0

export function export_stuff(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		inject,
		name,
		objects,
		packagename,
		tables,
		xxtea,
		exportNamespace,
		moreOptions,
	} = paras;

	let isSkipExportDefaults = !!moreOptions.SkipDefaults ?? false
	if (isSkipExportDefaults0) {
		isSkipExportDefaults = true
	}

	let firstLetterUpper = function (str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};
	let firstLetterLower = function (str: string) {
		return str.charAt(0).toLowerCase() + str.slice(1);
	};
	let convMemberName = function (str: string) {
		return str.split("_").map(s => firstLetterUpper(s)).join("")
	}
	let convVarName = firstLetterLower

	let RowClass = firstLetterUpper(name)
	let initFunc = name + "Init"
	let mapfield = fields.find(a => a.type == "key")//如果是map，则生成对应的map
	let mapName = name + "Map"

	let getFieldType = function (f: Field) {
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

	let getFkFieldType = function (field: Field) {
		return tables.find(a => a.name == field.fkTableName)!.fields!.find(a => a.name == field.fkFieldName)!.type
	}

	const genValue = (value: any, f: Field): string => {
		let t = f.type
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

	const getTitle = (v: Field) => {
		return v.describe.split("\n")[0]
	}

	const getDescripts = (v: Field) => {
		return v.describe.split("\n")
	}

	let temp = `
using System.Collections.Generic;
using System.Linq;

namespace ${exportNamespace}{
[System.Serializable]
public partial class ${RowClass} {

	public static List<${RowClass}> Configs = new List<${RowClass}>()
	{
${iff(!isSkipExportDefaults, () => `
${foreach(datas, data =>
	`		new ${RowClass}(${st(() => fields.map((f, index) => genValue(data[index], f)).join(", "))}),`
)}
`)}
	};

	public ${RowClass}() { }
	public ${RowClass}(${st(() => fields.map(f => `${getFieldType(f)} ${convVarName(f.name)}`).join(", "))})
	{
${foreach(fields, f =>
		`		this.${convMemberName(f.name)} = ${convVarName(f.name)};`
	)}
	}

	public virtual ${RowClass} MergeFrom(${RowClass} source)
	{
${foreach(fields, f =>
		`		this.${convMemberName(f.name)} = source.${convMemberName(f.name)};`
	)}
		return this;
	}

	public virtual ${RowClass} Clone()
	{
		var config = new ${RowClass}();
		config.MergeFrom(this);
		return config;
	}

	${cmm(/**生成字段 */)}
${foreach(fields, f => `
	/// <summary>
${foreach(getDescripts(f), line =>
		`	/// ${line}`
	)}
	/// </summary>
	public ${getFieldType(f)} ${convMemberName(f.name)};`
	)}

	${cmm(/**生成get字段 */)}
#region get字段
${foreach(fields, f => {
		if (f.nameOrigin != f.name) {
			return `	public ${getFieldType(f)} ${getTitle(f).replace(" ", "_")} => ${convMemberName(f.name)};`
		} else {
			return ""
		}
	}
	)}
#endregion

#region uid map
${foreach(fields, f => {
		if (f.isUnique) {
			let memberName = convMemberName(f.name);
			let tempDictByMemberName = `tempDictBy${memberName}`;
			let memberType = getFieldType(f);
			return `
		protected static Dictionary<${memberType}, ${RowClass}> ${tempDictByMemberName};
		public static ${RowClass} GetConfigBy${memberName}(${memberType} ${memberName})
		{
			if (${tempDictByMemberName} == null)
			{
				${tempDictByMemberName} = new Dictionary<${memberType}, ${RowClass}>(Configs.Count);
				for(var i = 0; i < Configs.Count; i++)
				{
					var c = Configs[i];
					${tempDictByMemberName}.Add(c.${memberName}, c);
				}
			}
#if UNITY_EDITOR
			if (${tempDictByMemberName}.Count != Configs.Count)
			{
				UnityEngine.Debug.LogError($"配表数据不一致(ConfigsUnmatched): {${tempDictByMemberName}.Count}!={Configs.Count}");
			}
#endif
			return ${tempDictByMemberName}.GetValueOrDefault(${memberName});
		}
`
		} else if (f.type == "number" || f.type == "int" || f.type == "long" || f.type == "string") {
			let memberName = convMemberName(f.name);
			let tempRecordsDictByMemberName = `tempRecordsDictBy${memberName}`;
			let memberType = getFieldType(f);
			return `
		protected static Dictionary<${memberType}, ${RowClass}[]> ${tempRecordsDictByMemberName};
		public static ${RowClass}[] GetConfigsBy${memberName}(${memberType} ${memberName})
		{
			if (${tempRecordsDictByMemberName} != null && ${tempRecordsDictByMemberName}.TryGetValue(${memberName},out var retValue))
			{
				return retValue;
			}
			else
			{
				if (${tempRecordsDictByMemberName} == null)
				{
					${tempRecordsDictByMemberName} = new Dictionary<${memberType}, ${RowClass}[]>(Configs.Count);
				}
				var records = Configs.Where(c => c.${memberName} == ${memberName}).ToArray();
				${tempRecordsDictByMemberName}.Add(${memberName}, records);
				return records;
			}
		}
`
		} else {
			return ""
		}
	}
	)}

#endregion uid map

#region 生成fk.get/set
${foreach(fields, f => `
${iff(f.type == "fk", () => `
${iff(getFkFieldType(f).toLowerCase() != "uid", () => `
	protected ${convMemberName(f.fkTableName!)}[] _fk${convMemberName(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${convMemberName(f.fkTableName!)}[] ${convMemberName(f.name)}DataList{
		get{
			if(this._fk${convMemberName(f.name)}==null){
				if(null==this.${convMemberName(f.name)}){
					this._fk${convMemberName(f.name)} = new ${convMemberName(f.fkTableName!)}[0];
				}else{
					this._fk${convMemberName(f.name)}=${convMemberName(f.fkTableName!)}.Configs.FindAll(a=>a.${convMemberName(f.fkFieldName!)}!=null && this.${convMemberName(f.name)}==a.${convMemberName(f.fkFieldName!)}).ToArray();
				}
			}
			return this._fk${convMemberName(f.name)};
		}
	}
`).else(() => `
	protected ${convMemberName(f.fkTableName!)} _fk${convMemberName(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${convMemberName(f.fkTableName!)} ${convMemberName(f.name)}Data{
		get{
			if(this._fk${convMemberName(f.name)}==null){
				this._fk${convMemberName(f.name)}=${convMemberName(f.fkTableName!)}.Configs.Find(a=>a.${convMemberName(f.fkFieldName!)}==this.${convMemberName(f.name)});
			}
			return this._fk${convMemberName(f.name)};
		}
	}
`)}
`)}
${iff(f.type == "fk[]", () => `
	protected ${convMemberName(f.fkTableName!)}[] _fk${convMemberName(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${convMemberName(f.fkTableName!)}[] ${convMemberName(f.name)}DataList{
		get{
			if(this._fk${convMemberName(f.name)}==null){
				if(null==this.${convMemberName(f.name)}){
					this._fk${convMemberName(f.name)} = new ${convMemberName(f.fkTableName!)}[0];
				}else{
					this._fk${convMemberName(f.name)}=${exportNamespace}.${convMemberName(f.fkTableName!)}.Configs.FindAll(a=>a.${convMemberName(f.fkFieldName!)}!=null && this.${convMemberName(f.name)}!.Contains(a.${convMemberName(f.fkFieldName!)})).ToArray();
				}
			}
			return this._fk${convMemberName(f.name)};
		}
	}
`)}
`)}
#endregion 生成fk.get/set
}
}
`

	return temp

}

export class ExportPlugin extends PluginBase {
	name = "csharp"
	tags: string[] = ["cs"]

	handleSheet(paras: HandleSheetParams) {
		let content = export_stuff(paras)
		if (content != null) {
			fs.outputFileSync(paras.outFilePath.fullPath, content, "utf-8")
		}
		return content
	}
}
