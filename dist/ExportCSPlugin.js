"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPlugin = exports.export_stuff = void 0;
const export_table_lib_1 = require("export-table-lib");
const CSParseTool_1 = require("./CSParseTool");
const CSProtoParser_1 = require("./CSProtoParser");
let protoParser = new CSProtoParser_1.CSProtoParser();
function export_stuff(paras) {
    let { datas, fields, inject, name, objects, packagename, tables, table: { nameOrigin, }, xxtea, exportNamespace, moreOptions, allTags, } = paras;
    let isSkipExportDefaults = !!(moreOptions?.SkipDefaults ?? false);
    if (CSParseTool_1.isSkipExportDefaults0) {
        isSkipExportDefaults = true;
    }
    let RowClass = (0, CSParseTool_1.firstLetterUpper)(name);
    let initFunc = name + "Init";
    let mapfield = fields.find(a => a.type == "key"); //如果是map，则生成对应的map
    let mapName = name + "Map";
    let customFields = [];
    for (let f2 of fields) {
        customFields.push(f2);
        let f3 = (0, CSParseTool_1.convTupleArrayType)(f2);
        if (f3 != undefined) {
            customFields.push(f3);
        }
    }
    let isValidField;
    let getFieldType2;
    let extendClass = "";
    let usingProtoNamespace = "";
    let classNameOrigin = (0, CSParseTool_1.firstLetterUpper)(nameOrigin);
    if (CSParseTool_1.isOverwriteWithProto) {
        console.log(`map class: ${classNameOrigin}`);
        let classInfo = protoParser.getClassInfo(classNameOrigin);
        if (classInfo != null) {
            extendClass = ` : ${classInfo.name}`;
            usingProtoNamespace = "\nusing DXTS.BattleProto;";
            // for (let f of classInfo.fields) {
            // 	console.log(`${f.csName}`)
            // }
        }
        isValidField = (f) => {
            let fieldInfo = classInfo?.getFieldInfo(f.name);
            // console.log(`validf: ${f.name}, ${fieldInfo}`)
            return fieldInfo == null;
        };
        getFieldType2 = (f) => {
            let fieldInfo = classInfo?.getFieldInfo(f.name);
            if (fieldInfo != null) {
                let fieldName = fieldInfo.getFieldType();
                return fieldName;
            }
            else {
                return (0, CSParseTool_1.getFieldType)(f);
            }
        };
    }
    else {
        isValidField = (f) => true;
        getFieldType2 = CSParseTool_1.getFieldType;
    }
    let validFields = fields.filter(f => isValidField(f));
    let mmpPrefix = CSParseTool_1.isOverwriteWithProto ? "[MemoryPackable]" : "";
    let isMMPEnabled = allTags.indexOf('csharp:mmp') != -1;
    let mmpNamespace = isMMPEnabled ? CSParseTool_1.useMMPNamespace : "";
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
${(0, export_table_lib_1.iff)(!isSkipExportDefaults, () => `
${(0, export_table_lib_1.foreach)(datas, data => `		new ${RowClass}(${(0, export_table_lib_1.st)(() => customFields.map((f, index) => (0, CSParseTool_1.genValue)(data[f.index], f)).join(", "))}),`)}
`)}
	};

	private static ${RowClass} _head;
	public static ${RowClass} Head => _head ??= Configs.Count > 0 ? Configs[0] : null;

	public ${RowClass}() { }
	public ${RowClass}(${(0, export_table_lib_1.st)(() => customFields.map(f => `${getFieldType2(f)} ${(0, CSParseTool_1.convVarName)(f.name)}`).join(", "))})
	{
${(0, export_table_lib_1.foreach)(customFields, f => `		this.${(0, CSParseTool_1.convMemberName)(f.name)} = ${(0, CSParseTool_1.convVarName)(f.name)};`)}
	}

	public virtual ${RowClass} MergeFrom(${RowClass} source)
	{
${(0, export_table_lib_1.foreach)(customFields, f => `		this.${(0, CSParseTool_1.convMemberName)(f.name)} = source.${(0, CSParseTool_1.convMemberName)(f.name)};`)}
		return this;
	}

	public virtual ${RowClass} Clone()
	{
		var config = new ${RowClass}();
		config.MergeFrom(this);
		return config;
	}

	${(0, export_table_lib_1.cmm)( /**生成字段 */)}
${(0, export_table_lib_1.foreach)(validFields, f => `
	/// <summary>
${(0, export_table_lib_1.foreach)((0, CSParseTool_1.getDescripts)(f), line => `	/// ${line}`)}
	/// </summary>
	${(0, CSParseTool_1.getFieldAnnotation)(f)}
	public ${getFieldType2(f)} ${(0, CSParseTool_1.convMemberName)(f.name)};

${(0, export_table_lib_1.iff)(f.rawType.startsWith("@"), () => `
	/// <summary>
${(0, export_table_lib_1.foreach)((0, CSParseTool_1.getDescripts)(f), line => `	/// ${line}`)}
	/// </summary>
	${(0, CSParseTool_1.getCustomFieldTypeAnnotation)(f)}
	${(0, CSParseTool_1.convTupleArrayTypeDefine)(f)}`)}`)}

	${(0, export_table_lib_1.cmm)( /**生成get字段 */)}
#region get字段
${(0, export_table_lib_1.foreach)(fields, f => {
        if (f.nameOrigin != f.name) {
            return `	public ${getFieldType2(f)} ${(0, CSParseTool_1.getTitle)(f).replace(" ", "_")} => ${(0, CSParseTool_1.convMemberName)(f.name)};`;
        }
        else {
            return "";
        }
    })}
#endregion

#region uid map
${(0, export_table_lib_1.foreach)(fields, f => {
        if (f.isUnique) {
            let memberName = (0, CSParseTool_1.convMemberName)(f.name);
            let paraName = (0, CSParseTool_1.convVarName)(memberName);
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
`;
        }
        else if (f.type == "number" || f.type == "float" || f.type == "int" || f.type == "long" || f.type == "string") {
            let memberName = (0, CSParseTool_1.convMemberName)(f.name);
            let paraName = (0, CSParseTool_1.convVarName)(memberName);
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
				${tempRecordsDictByMemberName}.Add(${paraName}, records);
				return records;
			}
		}
`;
        }
        else {
            return "";
        }
    })}

#endregion uid map

#region 生成fk.get/set
${(0, export_table_lib_1.foreach)(fields, f => `
${(0, export_table_lib_1.iff)(f.type == "fk", () => `
${(0, export_table_lib_1.iff)((0, CSParseTool_1.getFkFieldType)(tables, f).toLowerCase() != "uid", () => `
	protected ${(0, CSParseTool_1.convMemberName)(f.fkTableName)}[] _fk${(0, CSParseTool_1.convMemberName)(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${(0, CSParseTool_1.convMemberName)(f.fkTableName)}[] ${(0, CSParseTool_1.convMemberName)(f.name)}DataList{
		get{
			if(this._fk${(0, CSParseTool_1.convMemberName)(f.name)}==null){
				if(null==this.${(0, CSParseTool_1.convMemberName)(f.name)}){
					this._fk${(0, CSParseTool_1.convMemberName)(f.name)} = new ${(0, CSParseTool_1.convMemberName)(f.fkTableName)}[0];
				}else{
					this._fk${(0, CSParseTool_1.convMemberName)(f.name)}=${(0, CSParseTool_1.convMemberName)(f.fkTableName)}.Configs.FindAll(a=>a.${(0, CSParseTool_1.convMemberName)(f.fkFieldName)}!=null && this.${(0, CSParseTool_1.convMemberName)(f.name)}==a.${(0, CSParseTool_1.convMemberName)(f.fkFieldName)}).ToArray();
				}
			}
			return this._fk${(0, CSParseTool_1.convMemberName)(f.name)};
		}
	}
`).else(() => `
	protected ${(0, CSParseTool_1.convMemberName)(f.fkTableName)} _fk${(0, CSParseTool_1.convMemberName)(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${(0, CSParseTool_1.convMemberName)(f.fkTableName)} ${(0, CSParseTool_1.convMemberName)(f.name)}Data{
		get{
			if(this._fk${(0, CSParseTool_1.convMemberName)(f.name)}==null){
				this._fk${(0, CSParseTool_1.convMemberName)(f.name)}=${(0, CSParseTool_1.convMemberName)(f.fkTableName)}.Configs.Find(a=>a.${(0, CSParseTool_1.convMemberName)(f.fkFieldName)}==this.${(0, CSParseTool_1.convMemberName)(f.name)});
			}
			return this._fk${(0, CSParseTool_1.convMemberName)(f.name)};
		}
	}
`)}
`)}
${(0, export_table_lib_1.iff)(f.type == "fk[]", () => `
	protected ${(0, CSParseTool_1.convMemberName)(f.fkTableName)}[] _fk${(0, CSParseTool_1.convMemberName)(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${(0, CSParseTool_1.convMemberName)(f.fkTableName)}[] ${(0, CSParseTool_1.convMemberName)(f.name)}DataList{
		get{
			if(this._fk${(0, CSParseTool_1.convMemberName)(f.name)}==null){
				if(null==this.${(0, CSParseTool_1.convMemberName)(f.name)}){
					this._fk${(0, CSParseTool_1.convMemberName)(f.name)} = new ${(0, CSParseTool_1.convMemberName)(f.fkTableName)}[0];
				}else{
					this._fk${(0, CSParseTool_1.convMemberName)(f.name)}=${exportNamespace}.${(0, CSParseTool_1.convMemberName)(f.fkTableName)}.Configs.FindAll(a=>a.${(0, CSParseTool_1.convMemberName)(f.fkFieldName)}!=null && this.${(0, CSParseTool_1.convMemberName)(f.name)}!.Contains(a.${(0, CSParseTool_1.convMemberName)(f.fkFieldName)})).ToArray();
				}
			}
			return this._fk${(0, CSParseTool_1.convMemberName)(f.name)};
		}
	}
`)}
`)}
#endregion 生成fk.get/set
}
}
`;
    return temp;
}
exports.export_stuff = export_stuff;
class ExportPlugin extends export_table_lib_1.PluginBase {
    name = "csharp";
    tags = ["cs"];
    handleBatch(paras) {
        console.log(`try parse proto: ${CSParseTool_1.overwriteWithProtoPath}`);
        protoParser.parseProtoFile(CSParseTool_1.overwriteWithProtoPath);
    }
    handleSheet(paras) {
        let content = export_stuff(paras);
        if (content != null) {
            (0, CSParseTool_1.outputFileSync)(paras.outFilePath.fullPath, content, "utf-8");
        }
        return content;
    }
}
exports.ExportPlugin = ExportPlugin;
