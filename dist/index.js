"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.ExportPlugins = exports.ExportPlugin = exports.export_stuff = void 0;
const windy_quicktable_1 = require("windy-quicktable");
const fs = __importStar(require("fs"));
function export_stuff(paras) {
    let { datas, fields, inject, name, objects, packagename, tables, xxtea, } = paras;
    let firstLetterUpper = function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    let firstLetterLower = function (str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    };
    let convMemberName = firstLetterUpper;
    let convVarName = firstLetterLower;
    let RowClass = firstLetterUpper(name);
    let initFunc = name + "Init";
    let mapfield = fields.find(a => a.type == "key"); //如果是map，则生成对应的map
    let mapName = name + "Map";
    let getFieldType = function (t) {
        if (t == "object") {
            throw new Error("invalid type <object>");
        }
        else if (t == "object[]") {
            throw new Error("invalid type <object[]>");
        }
        else if (t == "number") {
            return "double";
        }
        else if (t == "number[]") {
            return "double[]";
        }
        else if (t == "uid") {
            return "int";
        }
        else if (t == "bool") {
            return "bool";
        }
        else if (t == "bool[]") {
            return "bool[]";
        }
        else if (t == "string") {
            return "string";
        }
        else if (t == "string[]") {
            return "string[]";
        }
        else if (t == "fk") {
            return "int";
        }
        else if (t == "fk[]") {
            return "int[]";
        }
        else if (t == "any") {
            throw new Error("invalid type <any>");
        }
        else if (t == "key") {
            return "string";
        }
        else {
            throw new Error("invalid type <unkown>");
        }
        return t;
    };
    const genValue = (value, t) => {
        if (t == "object") {
            throw new Error("invalid type <object>");
        }
        else if (t == "object[]") {
            throw new Error("invalid type <object[]>");
        }
        else if (t == "number") {
            return `${value}`;
        }
        else if (t == "number[]") {
            let values = value;
            return `new double[]{${values.join(", ")}}`;
        }
        else if (t == "uid") {
            return `${value}`;
        }
        else if (t == "bool") {
            return `${value}`;
        }
        else if (t == "bool[]") {
            let values = value;
            return `new bool[]{${values.join(", ")}}`;
        }
        else if (t == "string") {
            return `"${value}"`;
        }
        else if (t == "string[]") {
            let values = value;
            return `new string[]{${values.map(v => `"${v}"`).join(", ")}}`;
        }
        else if (t == "fk") {
            return `${value}`;
        }
        else if (t == "fk[]") {
            let values = value;
            return `new int[]{${values.join(", ")}}`;
        }
        else if (t == "any") {
            throw new Error("invalid type <any>");
        }
        else if (t == "key") {
            return `${value}`;
        }
        throw new Error("invalid type <unkown>");
    };
    const getTitle = (v) => {
        return v.describe.split("\n")[0];
    };
    const getDescripts = (v) => {
        return v.describe.split("\n");
    };
    let temp = `
using System.Collections.Generic;

public class ${RowClass} {

	public static List<${RowClass}> Configs = new List<${RowClass}>()
	{
${(0, windy_quicktable_1.foreach)(datas, data => `		new ${RowClass}(${(0, windy_quicktable_1.st)(() => fields.map((f, index) => genValue(data[index], f.type)).join(", "))}),`)}
	};

	public ${RowClass}() { }
	public ${RowClass}(${(0, windy_quicktable_1.st)(() => fields.map(f => `${getFieldType(f.type)} ${convVarName(f.name)}`).join(", "))})
	{
${(0, windy_quicktable_1.foreach)(fields, f => `		this.${convMemberName(f.name)} = ${convVarName(f.name)};`)}
	}

	public virtual ${RowClass} MergeFrom(${RowClass} source)
	{
${(0, windy_quicktable_1.foreach)(fields, f => `		this.${convMemberName(f.name)} = source.${convMemberName(f.name)};`)}
		return this;
	}

	public virtual ${RowClass} Clone()
	{
		var config = new ${RowClass}();
		config.MergeFrom(this);
		return config;
	}

	${(0, windy_quicktable_1.cmm)( /**生成字段 */)}
${(0, windy_quicktable_1.foreach)(fields, f => `
	/// <summary>
${(0, windy_quicktable_1.foreach)(getDescripts(f), line => `	/// ${line}`)}
	/// </summary>
	public ${getFieldType(f.type)} ${convMemberName(f.name)};`)}

	${(0, windy_quicktable_1.cmm)( /**生成get字段 */)}
	#region get字段
${(0, windy_quicktable_1.foreach)(fields, f => `	public ${getFieldType(f.type)} ${getTitle(f).replace(" ", "_")} => ${convMemberName(f.name)};`)}
	#endregion
}
`;
    return temp;
}
exports.export_stuff = export_stuff;
class ExportPlugin extends windy_quicktable_1.PluginBase {
    constructor() {
        super(...arguments);
        this.name = "csharp";
        this.tags = ["cs"];
    }
    handleSheet(paras) {
        let content = export_stuff(paras);
        if (content != null) {
            fs.writeFileSync(paras.outFilePath.fullPath, content, "utf-8");
        }
        return content;
    }
    handleBatch(paras) {
        console.log("lkwej:", paras.workbookManager.dataTables.length);
    }
}
exports.ExportPlugin = ExportPlugin;
exports.ExportPlugins = [
    new ExportPlugin(),
];
