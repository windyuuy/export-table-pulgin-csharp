
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath, makeFirstLetterUpper } from "export-table-lib"
import * as fs from "fs-extra"

let firstLetterUpper = makeFirstLetterUpper;
function exportUJson(paras: HandleSheetParams): string | null {
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
		Object.keys(obj).forEach(key => {
			var newKey = convMemberName(key);
			newObj[newKey] = obj[key];
		})
		return newObj
	}));

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
  m_Name: ${fullName}
  m_EditorClassIdentifier: 
  JsonText: ${JSON.stringify(jsonString)}
`
	return temp

}

function exportUJsonLoader(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
		table,
	} = paras;

	let RowClass = firstLetterUpper(name)
	var fullName = `${table.workbookName}-${name}`
	// !!!必须开头没有空格
	let temp = `
using lang.json;
using UnityEngine.AddressableAssets;
using System.Threading.Tasks;
using UnityEngine;

namespace MEEC.ExportedConfigs
{
    public partial class ${RowClass}
    {
        public static async Task Load()
        {
			var loadUrl="Assets/Bundles/GameConfigs/Auto/${fullName}.asset";
            var configJson = await Addressables.LoadAssetAsync<ExcelConfigJson>(loadUrl).Task;
			if (configJson != null)
            {
				var jsonObjs = JSON.parse<${RowClass}[]>(configJson.JsonText);
				var configs = ${RowClass}.Configs;
				configs.Clear();
				configs.AddRange(jsonObjs);
			}
            else
            {
                Debug.LogError($"配表资源缺失: {loadUrl}");
            }
        }
    }
}
`
	return temp

}

export class ExportUJsonPluginV1 extends PluginBase {
	name = "ujson1"
	tags: string[] = ["ujson1"]

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
				let savePath = new OutFilePath(paras.outPath, fullName, ".asset").fullPath
				fs.outputFileSync(savePath, content2, "utf-8")
			}
			return content2
		}
	}

	handleBatch(paras: HandleBatchParams): void {
		var tables = paras.tables;
		var temp = `
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MEEC.ExportedConfigs
{
	public static class DefaultConfigLoader{
		public static IEnumerable<Func<Task>> Load(){
${foreach(tables, (table) => `
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
