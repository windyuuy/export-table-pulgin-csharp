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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportLiteDBUJsonPlugin = exports.ConvJson2LiteDB = exports.RemoveJsonFiles = exports.exportUJsonLoader = void 0;
const export_table_lib_1 = require("export-table-lib");
const fs = __importStar(require("fs-extra"));
const CSParseTool_1 = require("./CSParseTool");
const path_1 = __importDefault(require("path"));
const cp = __importStar(require("child_process"));
const ExportUnityCSJsonPlugin_1 = require("./ExportUnityCSJsonPlugin");
var isSkipIndexLoader0 = process.argv.findIndex(v => v == "--SkipIndexLoader") >= 0;
function exportUJsonLoader(paras) {
    let { datas, fields, name, objects, table, exportNamespace, } = paras;
    let useJsonToolNamesapce = (0, CSParseTool_1.GetUsingJsonToolNamespace)();
    let RowClass = (0, CSParseTool_1.firstLetterUpper)(name);
    var fullName = `${table.workbookName}-${name}`;
    // !!!必须开头没有空格
    let temp = `
using System.Threading.Tasks;
using LiteDB;
using UnityEngine;
${useJsonToolNamesapce}

namespace ${exportNamespace}
{
	public partial class ${RowClass}
	{
		protected static LiteDatabase Database;
		protected static ILiteCollection<${RowClass}> Collection;
		public const string CollKey = "${fullName.replace("-", "_")}";
		public static Task Load()
		{
#if UNITY_EDITOR && ENABLE_CONFIG_LOG
			Debug.Log("ReferConfig-${RowClass}");
#endif
			var key = CollKey;
			var ldb = SharedLiteDB.Database;
			Database = ldb;
			if (!ldb.CollectionExists(key))
			{
				Debug.LogError($"配表资源缺失: {key}");
			}
			Collection = ldb.GetCollection<${RowClass}>(key);

			return Task.CompletedTask;
		}
	}
}
`;
    return temp;
}
exports.exportUJsonLoader = exportUJsonLoader;
async function RemoveJsonFiles(savePaths2) {
    let deleteTasks = savePaths2.map(async (savePath2) => {
        console.log(`delete file: ${savePath2}`);
        try {
            if (fs.existsSync(savePath2)) {
                fs.removeSync(savePath2);
            }
        }
        catch (ex) {
            console.error(`error: cannot delete file ${savePath2}`);
            console.error(ex);
        }
    });
    await Promise.all(deleteTasks);
}
exports.RemoveJsonFiles = RemoveJsonFiles;
async function ConvJson2LiteDB(litedbpath, savePaths) {
    if (litedbpath != null && litedbpath != "") {
        let modulePath = require.resolve(".");
        let binPath = path_1.default.resolve(modulePath, "../../bin/Json2LiteDB.exe");
        // let dbPath = path.resolve("../../../GameClient/Assets/Bundles/GameConfigs/Auto/MainConfig.db.bytes");
        // let dbPath = path.resolve(litedbpath)
        let savePaths2 = savePaths.map(savePath => path_1.default.resolve(savePath));
        let cmdParas = savePaths2.concat();
        cmdParas.unshift(litedbpath);
        let cmdParasLine = cmdParas.join(" ");
        let cmdline = `${binPath} ${cmdParasLine}`;
        console.log("execute-cmdline: " + cmdline);
        var output = cp.spawnSync(binPath, cmdParas);
        console.log(output.output.toString());
        RemoveJsonFiles(savePaths2);
    }
    else {
        console.log(`no litedbpath given, skip conv database`);
    }
}
exports.ConvJson2LiteDB = ConvJson2LiteDB;
class ExportLiteDBUJsonPlugin extends export_table_lib_1.PluginBase {
    name = "litedbujson";
    tags = ["litedbujson"];
    handleSheet(paras) {
        var fullName = `${paras.table.workbookName}-${paras.name}`;
        {
            let content1 = exportUJsonLoader(paras);
            if (content1 != null) {
                let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, "Loader.cs").fullPath;
                (0, CSParseTool_1.outputFileSync)(savePath, content1, "utf-8");
            }
        }
        {
            let content2 = (0, ExportUnityCSJsonPlugin_1.exportUJson)(paras);
            if (content2 != null) {
                let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, ".json").fullPath;
                (0, CSParseTool_1.outputFileSync)(savePath, content2, "utf-8");
            }
            return content2;
        }
    }
    async handleBatch(paras) {
        let { moreOptions, tables, exportNamespace, } = paras;
        let isSkipIndexLoader = moreOptions?.SkipIndexLoader ?? false;
        if (isSkipIndexLoader0) {
            isSkipIndexLoader = true;
        }
        if (isSkipIndexLoader) {
            return;
        }
        var temp = `
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${exportNamespace}
{
	public static class DefaultConfigLoader{
		public static IEnumerable<Func<Task>> Load(){
${(0, export_table_lib_1.foreach)(tables.sort((ta, tb) => ta.name.localeCompare(tb.name)), (table) => `
			yield return ${(0, CSParseTool_1.firstLetterUpper)(table.name)}.Load;
`)}
			yield break;
		}
	}
}
`;
        let savePath = paras.outPath + "/DefaultConfigLoader.cs";
        (0, CSParseTool_1.outputFileSync)(savePath, temp, "utf-8");
        // var options = new program.Command().option("--litedbpath <string>").parse(process.argv).allowUnknownOption(true).opts()
        // let litedbpath = options["litedbpath"]
        let litedbpathIndex = process.argv.indexOf("--litedbpath");
        let litedbpath = "";
        if (litedbpathIndex >= 0) {
            litedbpath = process.argv[litedbpathIndex + 1];
        }
        console.log(`litedbpath: ${litedbpath}`);
        let cmdParas = tables.map(table => {
            var fullName = `${table.workbookName}-${table.name}`;
            let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, ".json").fullPath;
            return savePath;
        });
        await ConvJson2LiteDB(litedbpath, cmdParas);
    }
}
exports.ExportLiteDBUJsonPlugin = ExportLiteDBUJsonPlugin;
