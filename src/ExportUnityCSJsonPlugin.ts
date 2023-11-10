
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath, makeFirstLetterUpper } from "export-table-lib"
import * as fs from "fs-extra"
import { TryConvValue } from "./ExportCSPlugin";

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

	let firstLetterLower = function (str: string) {
		return str.charAt(0).toLowerCase() + str.slice(1);
	};
	let convMemberName = function (str: string) {
		return str.split("_").map(s => firstLetterUpper(s)).join("")
	}

	var fullName = `${table.workbookName}-${name}`
	let jsonString = JSON.stringify(objects.map(obj => {
		var newObj = Object.create(null);
		for (let f of fields) {
			let key = f.name
			var newKey = convMemberName(key);
			newObj[newKey] = obj[key];

			let m = f.rawType.match(/\@\((\w+),(\w+)\)(\[\])?/)
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
	if(jsonToolNamespaceIndex>=0 && process.argv.length>jsonToolNamespaceIndex+1){
		jsonToolNamespace = process.argv[jsonToolNamespaceIndex+1]
	}

	let RowClass = firstLetterUpper(name)
	var fullName = `${table.workbookName}-${name}`
	// !!!必须开头没有空格
	let temp = `
using UnityEngine.AddressableAssets;
using System.Threading.Tasks;
using UnityEngine;
using ${jsonToolNamespace};

namespace ${exportNamespace}
{
	public partial class ${RowClass}
	{
#if UNITY_EDITOR && ENABLE_CONFIG_LOG
		static ${RowClass}()
		{
			Debug.Log("ReferConfig-${RowClass}");
		}
#endif
		public static async Task Load()
		{
			var loadUrl="Assets/Bundles/GameConfigs/Auto/${fullName}.json";
			var configJson =
#if UNITY_EDITOR
				Application.isPlaying ? await Addressables.LoadAssetAsync<TextAsset>(loadUrl).Task
					: UnityEditor.AssetDatabase.LoadAssetAtPath<TextAsset>(loadUrl);
#else
				await Addressables.LoadAssetAsync<TextAsset>(loadUrl).Task;
#endif
			if (configJson != null)
			{
				var jsonObjs = JSON.parse<${RowClass}[]>(configJson.text);
				var configs = ${RowClass}.Configs;
				configs.Clear();
				configs.AddRange(jsonObjs);
			}
			else
			{
				Debug.LogError($"配表资源缺失: {loadUrl}");
			}
		}

#if UNITY_EDITOR
		public static void LoadInEditor(bool force = false)
		{
			if (Application.isPlaying && (!force))
			{
				var tip = $"cannot load ${RowClass}[] with LoadInEditor at runtime";
				Debug.LogError(tip);
				throw new System.Exception(tip);
			}
			var loadUrl="Assets/Bundles/GameConfigs/Auto/${fullName}.json";
			var configJson = UnityEditor.AssetDatabase.LoadAssetAtPath<TextAsset>(loadUrl);
			if (configJson != null)
			{
				var jsonObjs = JSON.parse<${RowClass}[]>(configJson.text);
				var configs = ${RowClass}.Configs;
				configs.Clear();
				configs.AddRange(jsonObjs);
			}
			else
			{
				Debug.LogError($"配表资源缺失: {loadUrl}");
			}
		}
#endif
	}
}
`
	return temp

}

export class ExportUJsonPlugin extends PluginBase {
	name = "ujson"
	tags: string[] = ["ujson"]

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

	handleBatch(paras: HandleBatchParams): void {

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
	}
}
