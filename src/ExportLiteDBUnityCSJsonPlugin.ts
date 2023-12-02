
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath, makeFirstLetterUpper } from "export-table-lib"
import * as fs from "fs-extra"
import { TryConvValue, convMemberName } from "./CSParseTool";
import path from "path";
import * as cp from "child_process"
import program from "commander"

var isSkipIndexLoader0 = process.argv.findIndex(v => v == "--SkipIndexLoader") >= 0

let firstLetterUpper = makeFirstLetterUpper;
export function exportUJson(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
		table,
	} = paras;

	var fullName = `${table.workbookName}-${name}`
	let jsonString = JSON.stringify(objects.map(obj => {
		var newObj = Object.create(null);
		for (let f of fields) {
			let key = f.name
			var newKey = convMemberName(key);
			newObj[newKey] = obj[key];

			var line = f.rawType.replaceAll(/(?<=[^\w])(boolean)(?=[^\w]|$)/g, "bool");
			let m = line.match(/\@\((\w+),(\w+)\)(\[\])?/)
			if (m != null) {
				// [{"Item1":99,"Item2":"klwjefl"}]
				let content = obj[key] as string;
				let index = 0;
				let index2 = -1;
				let objs: object[] = []
				while (0 <= index && index < content.length) {
					index2 = content.indexOf("|", index)
					let numStr = content.substring(index, index2)
					let t1 = m[1]
					let v1 = TryConvValue(numStr, t1 as any, f);
					index = content.indexOf(";;", index2)
					let posEnd = index
					if (index == -1) {
						posEnd = content.length
					} else {
						index += 2
					}
					let ssStr = content.substring(index2 + 1, posEnd)
					let t2 = m[2]
					let v2 = TryConvValue(ssStr, t2 as any, f);
					console.log(`parseinfo1: ${content}, ${index2}, ${index}, ${numStr}, ${t1}, ${v1}`)
					console.log(`parseinfo2: ${content}, ${index2}, ${index}, ${ssStr}, ${t2}, ${v2}`)
					objs.push({
						Item1: v1,
						Item2: v2,
					})
				}

				let isArray = m[3] == "[]"
				if (isArray) {
					newObj[newKey + "Obj"] = objs
				} else {
					if (objs.length > 1) {
						console.log(`配置错误，过多的条目数量: ${content}`)
					}
					newObj[newKey + "Obj"] = objs[0] ?? {}
				}
			}
		}
		// Object.keys(obj).forEach(key => {
		// 	var newKey = convMemberName(key);
		// 	newObj[newKey] = obj[key];
		// })
		return newObj
	}));

	return jsonString;

	// 	// !!!必须开头没有空格
	// 	let temp = `%YAML 1.1
	// %TAG !u! tag:unity3d.com,2011:
	// --- !u!114 &11400000
	// MonoBehaviour:
	//   m_ObjectHideFlags: 0
	//   m_CorrespondingSourceObject: {fileID: 0}
	//   m_PrefabInstance: {fileID: 0}
	//   m_PrefabAsset: {fileID: 0}
	//   m_GameObject: {fileID: 0}
	//   m_Enabled: 1
	//   m_EditorHideFlags: 0
	//   m_Script: {fileID: 11500000, guid: 496f60086c072a8479a6e0b948efb5e8, type: 3}
	//   m_Name: ${fullName}
	//   m_EditorClassIdentifier:
	//   JsonText: ${JSON.stringify(jsonString)}
	// `
	// 	return temp

}

export function exportUJsonLoader(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
		table,
		exportNamespace,
	} = paras;

	let jsonToolNamespaceIndex = process.argv.findIndex(v => v == "--JsonToolNamespace")
	let jsonToolNamespace = "lang.json";
	if (jsonToolNamespaceIndex >= 0 && process.argv.length > jsonToolNamespaceIndex + 1) {
		jsonToolNamespace = process.argv[jsonToolNamespaceIndex + 1]
	}

	let RowClass = firstLetterUpper(name)
	var fullName = `${table.workbookName}-${name}`
	// !!!必须开头没有空格
	let temp = `
using UnityEngine.AddressableAssets;
using System.Threading.Tasks;
using LiteDB;
using UnityEngine;
using ${jsonToolNamespace};

namespace ${exportNamespace}
{
	public partial class ${RowClass}
	{
		protected static LiteDatabase Database;
		protected static ILiteCollection<${RowClass}> Collection;
		public static Task Load()
		{
#if UNITY_EDITOR && ENABLE_CONFIG_LOG
			Debug.Log("ReferConfig-${RowClass}");
#endif
			
			var ldb = SharedLiteDB.Database;
			Database = ldb;
			const string key = "${fullName.replace("-", "_")}";
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
	if (litedbpath != null) {
		let modulePath = require.resolve(".")
		let binPath = path.resolve(modulePath, "../../bin/Json2LiteDB.exe")
		// let dbPath = path.resolve("../../../GameClient/Assets/Bundles/GameConfigs/Auto/MainConfig.db.bytes");
		let dbPath = path.resolve(litedbpath)
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
		let isSkipIndexLoader = !!moreOptions?.SkipIndexLoader ?? false
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

		var options = new program.Command().option("--litedbpath <string>").parse(process.argv).opts()
		let litedbpath = options["litedbpath"]
		console.log(`litedbpath: ${litedbpath}`);

		let cmdParas = tables.map(table => {
			var fullName = `${table.workbookName}-${table.name}`
			let savePath = new OutFilePath(paras.outPath, fullName, ".json").fullPath
			return savePath
		})

		await ConvJson2LiteDB(litedbpath, cmdParas);

	}
}
