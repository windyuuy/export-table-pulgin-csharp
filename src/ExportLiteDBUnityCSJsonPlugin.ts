
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath, makeFirstLetterUpper } from "export-table-lib"
import * as fs from "fs-extra"
import { GetUsingJsonToolNamespace, TryConvValue, convMemberName, firstLetterUpper } from "./CSParseTool";
import path from "path";
import * as cp from "child_process"
import { exportUJson } from "./ExportUnityCSJsonPlugin";

var isSkipIndexLoader0 = process.argv.findIndex(v => v == "--SkipIndexLoader") >= 0

export function exportUJsonLoader(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
		table,
		exportNamespace,
	} = paras;

	let useJsonToolNamesapce = GetUsingJsonToolNamespace()

	let RowClass = firstLetterUpper(name)
	var fullName = `${table.workbookName}-${name}`
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
`
	return temp

}

export async function RemoveJsonFiles(savePaths2: string[]) {
	let deleteTasks = savePaths2.map(async (savePath2) => {
		console.log(`delete file: ${savePath2}`)
		try {
			if (fs.existsSync(savePath2)) {
				fs.removeSync(savePath2);
			}
		} catch (ex) {
			console.error(`error: cannot delete file ${savePath2}`);
			console.error(ex);
		}
	})

	await Promise.all(deleteTasks)
}
export async function ConvJson2LiteDB(litedbpath: string, savePaths: string[]) {
	if (litedbpath != null && litedbpath != "") {
		let modulePath = require.resolve(".")
		let binPath = path.resolve(modulePath, "../../bin/Json2LiteDB.exe")
		// let dbPath = path.resolve("../../../GameClient/Assets/Bundles/GameConfigs/Auto/MainConfig.db.bytes");
		// let dbPath = path.resolve(litedbpath)
		let savePaths2 = savePaths.map(savePath => path.resolve(savePath))
		let cmdParas = savePaths2.concat();
		cmdParas.unshift(litedbpath);
		let cmdParasLine = cmdParas.join(" ");
		let cmdline = `${binPath} ${cmdParasLine}`;
		console.log("execute-cmdline: " + cmdline)
		var output = cp.spawnSync(binPath, cmdParas)
		console.log(output.output.toString())

		RemoveJsonFiles(savePaths2)
	} else {
		console.log(`no litedbpath given, skip conv database`)
	}
}

export class ExportLiteDBUJsonPlugin extends PluginBase {
	name = "litedbujson"
	tags: string[] = ["litedbujson"]

	handleSheet(paras: HandleSheetParams) {
		var fullName = `${paras.table.workbookName}-${paras.name}`
		{
			let content1 = exportUJsonLoader(paras)
			if (content1 != null) {
				let savePath = new OutFilePath(paras.outPath, fullName, "Loader.cs").fullPath
				fs.outputFileSync(savePath, content1, "utf-8")
			}
		}
		{
			let content2 = exportUJson(paras)
			if (content2 != null) {
				let savePath = new OutFilePath(paras.outPath, fullName, ".json").fullPath
				fs.outputFileSync(savePath, content2, "utf-8")
			}

			return content2
		}
	}

	async handleBatch(paras: HandleBatchParams) {

		let {
			moreOptions,
			tables,
			exportNamespace,
		} = paras
		let isSkipIndexLoader = moreOptions?.SkipIndexLoader ?? false
		if (isSkipIndexLoader0) {
			isSkipIndexLoader = true
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
${foreach(tables.sort((ta, tb) => ta.name.localeCompare(tb.name)), (table) => `
			yield return ${firstLetterUpper(table.name)}.Load;
`)}
			yield break;
		}
	}
}
`
		let savePath = paras.outPath + "/DefaultConfigLoader.cs";
		fs.outputFileSync(savePath, temp, "utf-8");

		// var options = new program.Command().option("--litedbpath <string>").parse(process.argv).allowUnknownOption(true).opts()
		// let litedbpath = options["litedbpath"]
		let litedbpathIndex = process.argv.indexOf("--litedbpath")
		let litedbpath: string = "";
		if (litedbpathIndex >= 0) {
			litedbpath = process.argv[litedbpathIndex + 1]
		}
		console.log(`litedbpath: ${litedbpath}`);

		let cmdParas = tables.map(table => {
			var fullName = `${table.workbookName}-${table.name}`
			let savePath = new OutFilePath(paras.outPath, fullName, ".json").fullPath
			return savePath
		})

		await ConvJson2LiteDB(litedbpath, cmdParas);

	}
}
