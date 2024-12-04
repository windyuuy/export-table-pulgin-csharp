
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, iff, FieldType, makeFirstLetterLower, DataTable } from "export-table-lib"
import { convMemberName, convTupleArrayType, convTupleArrayTypeDefine, convVarName, firstLetterUpper, genValue, getCustomFieldTypeAnnotation, getDescripts, getFieldAnnotation, getFieldType, getFkFieldType, getTitle, isSkipExportDefaults0, useMMPNamespace } from "./CSParseTool"
import * as fs from "fs-extra"

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
		allTags,
	} = paras;

	let isSkipExportDefaults = !!(moreOptions?.SkipDefaults ?? false)
	if (isSkipExportDefaults0) {
		isSkipExportDefaults = true
	}

	let RowClass = firstLetterUpper(name)
	let initFunc = name + "Init"
	let mapfield = fields.find(a => a.type == "key")//如果是map，则生成对应的map
	let mapName = name + "Map"

	let customFields: Field[] = []
	for (let f2 of fields) {
		customFields.push(f2)
		let f3 = convTupleArrayType(f2)
		if (f3 != undefined) {
			customFields.push(f3)
		}
	}

	let isMMPEnabled = allTags.indexOf('csharp:mmp') != -1
	let mmpNamespace = isMMPEnabled ? useMMPNamespace : ""

	let temp = `
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
${mmpNamespace}

namespace ${exportNamespace}{
[System.Serializable]
public partial class ${RowClass} {

	public static List<${RowClass}> Configs = new List<${RowClass}>()
	{
${iff(!isSkipExportDefaults, () => `
${foreach(datas, data =>
		`		new ${RowClass}(${st(() => customFields.map((f, index) => genValue(data[f.index], f)).join(", "))}),`
	)}
`)}
	};

	public ${RowClass}() { }
	public ${RowClass}(${st(() => customFields.map(f => `${getFieldType(f)} ${convVarName(f.name)}`).join(", "))})
	{
${foreach(customFields, f =>
		`		this.${convMemberName(f.name)} = ${convVarName(f.name)};`
	)}
	}

	public virtual ${RowClass} MergeFrom(${RowClass} source)
	{
${foreach(customFields, f =>
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
	${getFieldAnnotation(f)}
	public ${getFieldType(f)} ${convMemberName(f.name)};

${iff(f.rawType.startsWith("@"), () => `
	/// <summary>
${foreach(getDescripts(f), line =>
		`	/// ${line}`
	)}
	/// </summary>
	${getCustomFieldTypeAnnotation(f)}
	${convTupleArrayTypeDefine(f)}`)}`
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
			let paraName = convVarName(memberName);
			let tempDictByMemberName = `TempDictBy${memberName}`;
			let memberType = getFieldType(f);
			return `
		protected static Dictionary<${memberType}, ${RowClass}> ${tempDictByMemberName};
		public static ${RowClass} GetConfigBy${memberName}(${memberType} ${paraName})
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
			return ${tempDictByMemberName}.GetValueOrDefault(${paraName});
		}
`
		} else if (f.type == "number" || f.type == "float" || f.type == "int" || f.type == "long" || f.type == "string") {
			let memberName = convMemberName(f.name);
			let paraName = convVarName(memberName);
			let tempRecordsDictByMemberName = `TempRecordsDictBy${memberName}`;
			let memberType = getFieldType(f);
			return `
		protected static Dictionary<${memberType}, ${RowClass}[]> ${tempRecordsDictByMemberName};
		public static ${RowClass}[] GetConfigsBy${memberName}(${memberType} ${paraName})
		{
			if (${tempRecordsDictByMemberName} != null && ${tempRecordsDictByMemberName}.TryGetValue(${paraName},out var retValue))
			{
				return retValue;
			}
			else
			{
				if (${tempRecordsDictByMemberName} == null)
				{
					${tempRecordsDictByMemberName} = new Dictionary<${memberType}, ${RowClass}[]>(Configs.Count);
				}
				var records = Configs.Where(c => c.${memberName} == ${paraName}).ToArray();
				${tempRecordsDictByMemberName}.Add(${paraName}, records);
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
${iff(getFkFieldType(tables, f).toLowerCase() != "uid", () => `
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
