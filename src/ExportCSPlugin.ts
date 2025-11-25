
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, iff, FieldType, makeFirstLetterLower, DataTable } from "export-table-lib"
import { convMemberName, convTupleArrayType, convTupleArrayTypeDefine, convVarName, firstLetterUpper, genValue, getCustomFieldTypeAnnotation, getDescripts, getFieldAnnotation, getFieldType, getFkFieldType, getTitle, isOverwriteWithProto, isSkipExportDefaults0, outputFileSync, overwriteWithProtoPath, useMMPNamespace } from './CSParseTool';
import * as fs from "fs-extra"
import { CSProtoParser } from "./CSProtoParser";
let protoParser = new CSProtoParser()

export function export_stuff(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		inject,
		name,
		objects,
		packagename,
		tables,
		table: { nameOrigin, },
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


	let isValidField: (f: Field) => boolean
	let getFieldType2: (f: Field) => string
	let extendClass = ""
	let usingProtoNamespace = ""
	let classNameOrigin = firstLetterUpper(nameOrigin)
	if (isOverwriteWithProto) {
		console.log(`map class: ${classNameOrigin}`)
		let classInfo = protoParser.getClassInfo(classNameOrigin)
		if (classInfo != null) {
			extendClass = ` : ${classInfo.name}`
			usingProtoNamespace = "\nusing DXTS.BattleProto;"
			// for (let f of classInfo.fields) {
			// 	console.log(`${f.csName}`)
			// }
		}
		isValidField = (f: Field) => {
			let fieldInfo = classInfo?.getFieldInfo(f.name)
			// console.log(`validf: ${f.name}, ${fieldInfo}`)
			return fieldInfo == null
		}
		getFieldType2 = (f: Field) => {
			let fieldInfo = classInfo?.getFieldInfo(f.name)
			if (fieldInfo != null) {
				let fieldName = fieldInfo.getFieldType()
				return fieldName
			} else {
				return getFieldType(f);
			}
		}
	} else {
		isValidField = (f: Field) => true;
		getFieldType2 = getFieldType
	}
	let validFields = fields.filter(f => isValidField(f))
	let mmpPrefix = isOverwriteWithProto ? "[MemoryPackable]" : ""

	let isMMPEnabled = allTags.indexOf('csharp:mmp') != -1
	let mmpNamespace = isMMPEnabled ? useMMPNamespace : ""

	let temp = `
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;${usingProtoNamespace}
${mmpNamespace}

namespace ${exportNamespace}{
[System.Serializable]
public partial class ${RowClass}${extendClass} {

	public static List<${RowClass}> Configs = new List<${RowClass}>()
	{
${iff(!isSkipExportDefaults, () => `
${foreach(datas, data =>
		`		new ${RowClass}(${st(() => customFields.map((f, index) => genValue(data[f.index], f)).join(", "))}),`
	)}
`)}
	};

	private static ${RowClass} _head;
	public static ${RowClass} Head => _head ??= Configs.Count > 0 ? Configs[0] : null;

	public ${RowClass}() { }
	public ${RowClass}(${st(() => customFields.map(f => `${getFieldType2(f)} ${convVarName(f.name)}`).join(", "))})
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
${foreach(validFields, f => `
	/// <summary>
${foreach(getDescripts(f), line =>
		`	/// ${line}`
	)}
	/// </summary>
	${getFieldAnnotation(f)}
	public ${getFieldType2(f)} ${convMemberName(f.name)};

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
			return `	public ${getFieldType2(f)} ${getTitle(f).replace(" ", "_")} => ${convMemberName(f.name)};`
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
			let memberType = getFieldType2(f);
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
					if(!${tempDictByMemberName}.TryAdd(c.${memberName}, c))
					{
						UnityEngine.Debug.LogError($"重复的配表字段唯一值<${RowClass}.${memberName}>: {c.${memberName}}");
					}
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
			let memberType = getFieldType2(f);
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
				if(!${tempRecordsDictByMemberName}.TryAdd(${paraName}, records))
				{
					UnityEngine.Debug.LogError($"重复的配表多对一字段值<${RowClass}.${paraName}>: {${paraName}}");
				}
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

	handleBatch(paras: HandleBatchParams): void {
		console.log(`try parse proto: ${overwriteWithProtoPath}`)
		protoParser.parseProtoFile(overwriteWithProtoPath)
	}
	handleSheet(paras: HandleSheetParams) {
		let content = export_stuff(paras)
		if (content != null) {
			outputFileSync(paras.outFilePath.fullPath, content, "utf-8")
		}
		return content
	}
}
