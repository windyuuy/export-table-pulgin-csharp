"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportLiteDBCSPlugin = exports.export_stuff = void 0;
const export_table_lib_1 = require("export-table-lib");
const CSParseTool_1 = require("./CSParseTool");
const fs = __importStar(require("fs-extra"));
function export_stuff(paras) {
    let { datas, fields, inject, name, objects, packagename, tables, xxtea, exportNamespace, moreOptions, } = paras;
    let isSkipExportDefaults = !!moreOptions?.SkipDefaults ?? false;
    if (CSParseTool_1.isSkipExportDefaults0) {
        isSkipExportDefaults = true;
    }
    let RowClass = (0, CSParseTool_1.firstLetterUpper)(name);
    let initFunc = name + "Init";
    let mapfield = fields.find(a => a.type == "key"); //如果是map，则生成对应的map
    let mapName = name + "Map";
    let temp = `
using System.Collections.Generic;
using System.Linq;

namespace ${exportNamespace}{
[System.Serializable]
public partial class ${RowClass} {

	private static List<${RowClass}> _configs;

	public static List<${RowClass}> Configs
	{
		get
		{
			if (_configs == null)
			{
				_configs = Collection.FindAll().ToList();
			}

			return _configs;
		}
	}

	public ${RowClass}() { }
	public ${RowClass}(${(0, export_table_lib_1.st)(() => fields.map(f => `${(0, CSParseTool_1.getFieldType)(f)} ${(0, CSParseTool_1.convVarName)(f.name)}`).join(", "))})
	{
${(0, export_table_lib_1.foreach)(fields, f => `		this.${(0, CSParseTool_1.convMemberName)(f.name)} = ${(0, CSParseTool_1.convVarName)(f.name)};`)}
	}

	public virtual ${RowClass} MergeFrom(${RowClass} source)
	{
${(0, export_table_lib_1.foreach)(fields, f => `		this.${(0, CSParseTool_1.convMemberName)(f.name)} = source.${(0, CSParseTool_1.convMemberName)(f.name)};`)}
		return this;
	}

	public virtual ${RowClass} Clone()
	{
		var config = new ${RowClass}();
		config.MergeFrom(this);
		return config;
	}

	${(0, export_table_lib_1.cmm)( /**生成字段 */)}
${(0, export_table_lib_1.foreach)(fields, f => `
	/// <summary>
${(0, export_table_lib_1.foreach)((0, CSParseTool_1.getDescripts)(f), line => `	/// ${line}`)}
	/// </summary>
	public ${(0, CSParseTool_1.getFieldType)(f)} ${(0, CSParseTool_1.convMemberName)(f.name)};

${(0, export_table_lib_1.iff)(f.rawType.startsWith("@"), () => `
	/// <summary>
${(0, export_table_lib_1.foreach)((0, CSParseTool_1.getDescripts)(f), line => `	/// ${line}`)}
	/// </summary>
	${(0, CSParseTool_1.convTupleArrayType)(f)}`)}`)}

	${(0, export_table_lib_1.cmm)( /**生成get字段 */)}
#region get字段
${(0, export_table_lib_1.foreach)(fields, f => {
        if (f.nameOrigin != f.name) {
            return `	public ${(0, CSParseTool_1.getFieldType)(f)} ${(0, CSParseTool_1.getTitle)(f).replace(" ", "_")} => ${(0, CSParseTool_1.convMemberName)(f.name)};`;
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
            let memberType = (0, CSParseTool_1.getFieldType)(f);
            return `
		protected static Dictionary<${memberType}, ${RowClass}> ${tempDictByMemberName};
		public static ${RowClass} GetConfigBy${memberName}(${memberType} ${paraName})
		{
			if (${tempDictByMemberName} == null)
			{
				${tempDictByMemberName} = new Dictionary<${memberType}, ${RowClass}>(Configs.Count);
			}

			if (${tempDictByMemberName}.TryGetValue(${paraName}, out var result))
			{
				return result;
			}

			result = Collection.FindOne(record => record.${memberName} == ${paraName});
			${tempDictByMemberName}.Add(${paraName}, result);
			return result;
		}
`;
        }
        else if (f.type == "number" || f.type == "float" || f.type == "int" || f.type == "long" || f.type == "string") {
            let memberName = (0, CSParseTool_1.convMemberName)(f.name);
            let paraName = (0, CSParseTool_1.convVarName)(memberName);
            let tempRecordsDictByMemberName = `TempRecordsDictBy${memberName}`;
            let memberType = (0, CSParseTool_1.getFieldType)(f);
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
				var records = Collection.Find(c => c.${memberName} == ${paraName}).ToArray();
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
class ExportLiteDBCSPlugin extends export_table_lib_1.PluginBase {
    name = "litedbcs";
    tags = ["litedbcs"];
    handleSheet(paras) {
        let content = export_stuff(paras);
        if (content != null) {
            var fullName = `${paras.table.workbookName}-${paras.name}`;
            let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, ".cs").fullPath;
            fs.outputFileSync(savePath, content, "utf-8");
        }
        return content;
    }
}
exports.ExportLiteDBCSPlugin = ExportLiteDBCSPlugin;
