
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath } from "export-table-lib"
import * as fs from "fs-extra"

export function export_stuff(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
	} = paras;

	let mainField: Field = fields.find(f => f.type == "uid") ?? fields[0]
	let jsonString = `
{
${foreach(objects, obj => `
    "${obj[mainField.name]}" : ${JSON.stringify(obj)}
`, ",\n")}
}
`
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
`
	return temp

}

export class ExportUJsonPlugin extends PluginBase {
	name = "ujson"
	tags: string[] = ["ujson"]

	handleSheet(paras: HandleSheetParams) {
		let content = export_stuff(paras)
		if (content != null) {
			let savePath = new OutFilePath(paras.outPath, paras.table.name, ".asset").fullPath
			fs.outputFileSync(savePath, content, "utf-8")
		}
		return content
	}
}
