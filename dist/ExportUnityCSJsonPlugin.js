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
exports.ExportUJsonPlugin = exports.export_stuff = void 0;
const export_table_lib_1 = require("export-table-lib");
const fs = __importStar(require("fs-extra"));
function export_stuff(paras) {
    var _a;
    let { datas, fields, name, objects, } = paras;
    let mainField = (_a = fields.find(f => f.type == "uid")) !== null && _a !== void 0 ? _a : fields[0];
    let jsonString = `
{
${(0, export_table_lib_1.foreach)(objects, obj => `
    "${obj[mainField.name]}" : ${JSON.stringify(obj)}
`, ",\n")}
}
`;
    // !!!必须开头没有空格
    let temp = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 496f60086c072a8479a6e0b948efb5e8, type: 3}
  m_Name: ${name}
  m_EditorClassIdentifier: 
  JsonText: ${JSON.stringify(jsonString)}
`;
    return temp;
}
exports.export_stuff = export_stuff;
class ExportUJsonPlugin extends export_table_lib_1.PluginBase {
    constructor() {
        super(...arguments);
        this.name = "ujson";
        this.tags = ["ujson"];
    }
    handleSheet(paras) {
        let content = export_stuff(paras);
        if (content != null) {
            let savePath = new export_table_lib_1.OutFilePath(paras.outPath, paras.table.name, ".asset").fullPath;
            fs.outputFileSync(savePath, content, "utf-8");
        }
        return content;
    }
}
exports.ExportUJsonPlugin = ExportUJsonPlugin;
