
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath, makeFirstLetterUpper } from "export-table-lib"
import * as fs from "fs-extra"
import { GetUsingJsonToolNamespace, TryConvValue, convMemberName, genTupleArrayValue, isEnableMMP } from "./CSParseTool";

var isSkipIndexLoader0 = process.argv.findIndex(v => v == "--SkipIndexLoader") >= 0
var isWrapObject = process.argv.findIndex(v => v == "--WrapObject") >= 0

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

			let content = obj[key]
			let result = genTupleArrayValue(f, content)
			if (result != null) {
				let { isArray, objs } = result
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

	if(isWrapObject){
		jsonString = `{"A":${jsonString}}`
	}

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
		allTags,
	} = paras;

	let useJsonToolNamesapce = GetUsingJsonToolNamespace()

	let RowClass = firstLetterUpper(name)
	let fullName = `${table.workbookName}-${name}`

	let isMMP = isEnableMMP || allTags.indexOf('csharp:mmp') != -1
	let fileExt = isMMP ? ".bytes" : ".json"

	// !!!必须开头没有空格
	let temp = `
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
${useJsonToolNamesapce}

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
		[System.Serializable]
		private struct TempA
		{
			public List<${RowClass}> a;
		}

		public const string LoadUrl = "Assets/Bundles/GameConfigs/Auto/${fullName}${fileExt}";

		public static async Task Load()
		{
			var loadUrl = LoadUrl;
			var configLiteral = await ConfigAssetLoader.LoadAssetAsync(loadUrl);
			if (configLiteral != null)
			{
				Debug.Log($"解析配表: {loadUrl}");
				try
				{
					// JsonUtility.FromJsonOverwrite("{\\"a\\":"+configLiteral+"}", obj);
					ConfigAssetLoader.LoadConfigs(configLiteral, Configs);
				}
				catch(System.Exception ex)
				{
					Debug.LogError($"解析配表失败: {loadUrl}");
                    throw ex;
				}
			}
			else
			{
				Debug.LogError($"配表资源缺失: {loadUrl}");
			}
		}

#if UNITY_EDITOR
		public static void LoadInEditor(bool force = false, System.Func<string, string> pathConverter = null)
		{
			if (Application.isPlaying && (!force))
			{
				var tip = $"cannot load ${RowClass}[] with LoadInEditor at runtime";
				Debug.LogError(tip);
				throw new System.Exception(tip);
			}
			var loadUrl = pathConverter == null ? LoadUrl : pathConverter(LoadUrl);
			var configJson = System.IO.File.ReadAllText(loadUrl, System.Text.Encoding.UTF8);
			if (configJson != null)
			{
				var obj = new TempA()
				{
					a=${RowClass}.Configs,
				};
				try
				{
					// JsonUtility.FromJsonOverwrite("{\\"a\\":"+configJson+"}", obj);
					ConfigAssetLoader.LoadConfigs(configLiteral, Configs);
				}
				catch(System.Exception ex)
				{
					Debug.LogError($"解析配表失败: {loadUrl}");
                    throw ex;
				}
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
		
#if UNITY_EDITOR
		public static IEnumerable<Action<bool, System.Func<string, string>>> LoadInEditor(){
${foreach(tables.sort((ta, tb) => ta.name.localeCompare(tb.name)), (table) => `
			yield return ${firstLetterUpper(table.name)}.LoadInEditor;
`)}
			yield break;
		}
#endif
	}
}
`
		let savePath = paras.outPath + "/DefaultConfigLoader.cs";
		fs.outputFileSync(savePath, temp, "utf-8");
	}
}
