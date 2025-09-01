
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath, makeFirstLetterUpper, iff } from "export-table-lib"
import * as fs from "fs-extra"
import { convMemberName, convVarName, getFieldElementType, getFieldType, isTypeArray, outputFileSync, useMMPNamespace } from "./CSParseTool";

var isEnableMMPB = process.argv.findIndex(v => v == "--EnableMMPB") >= 0

let firstLetterUpper = makeFirstLetterUpper;

export function exportMMP(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
		table,
		exportNamespace,
	} = paras;

	let RowClass = firstLetterUpper(name)
	var fullName = `${table.workbookName}-${name}`
	var mmpMark = "[System.Runtime.InteropServices.StructLayout(LayoutKind.Sequential, Pack = 4, CharSet = CharSet.Ansi)]";
	// TODO: 支持FK类型
	let temp = `
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
${useMMPNamespace}

namespace ${exportNamespace}
{
	${mmpMark}
	public partial class ${RowClass} : IMMPSerializable
	{
		private static int _typeSize = -1;

		public static int GetTypeSize()
		{
			if (_typeSize >= 0)
			{
				return _typeSize;
			}

			_typeSize = Marshal.SizeOf<${RowClass}>();
			return _typeSize;
		}

		public void Serialize(ref SerializeParas paras)
		{
${foreach(fields, f => `
${iff(f.type == "string[]", () => `
			var ${convVarName(f.name)} = this.${convMemberName(f.name)}; this.${convMemberName(f.name)} = null;
`)}
`)}
			Marshal.StructureToPtr(this, paras.Ptr, false);
${foreach(fields, f => `
${iff(f.type == "string[]", () => `
			this.${convMemberName(f.name)} = ${convVarName(f.name)};
`)}
`)}
			paras.Offset += GetTypeSize();
${foreach(fields, f => `
${iff(f.type == "string", () => `
			// ${f.name}
			BitUtils.FromString(ref paras, this.${convMemberName(f.name)});
${iff(f.rawType.startsWith("@") && f.rawType.endsWith("[]"), () => `
			BitUtils.FromSArray(ref paras, this.${convMemberName(f.name)}Obj);
`)}
`).elseif(f.type == "string[]", () => `
			// ${f.name}
			BitUtils.FromArray(ref paras, this.${convMemberName(f.name)}, BitUtils.FromString);
`).elseif(isTypeArray(f), () => `
			// ${f.name}
			BitUtils.FromRawArray(ref paras, this.${convMemberName(f.name)});
`).else(() => `
`)}
`, "\n")}
		}

		public void Deserialize(ref DeserializeParas paras)
		{
			Marshal.PtrToStructure(paras.Ptr, this);
			paras.Offset += GetTypeSize();
${foreach(fields, f => `
${iff(f.type == "string", () => `
			// ${f.name}
			this.${convMemberName(f.name)} = BitUtils.ToString(ref paras);
${iff(f.rawType.startsWith("@") && f.rawType.endsWith("[]"), () => `
			BitUtils.ToSArray(ref paras, ref this.${convMemberName(f.name)}Obj);
`)}
`).elseif(f.type == "string[]", () => `
			// ${f.name}
			this.${convMemberName(f.name)} = BitUtils.ToArray(ref paras, BitUtils.ToString);
`).elseif(isTypeArray(f), () => `
			// ${f.name}
			this.${convMemberName(f.name)} = BitUtils.ToRawArray<${getFieldElementType(f)}>(ref paras);
`).else(() => `
`)}
`)}
		}

		public static IEnumerable<IMMPSerializable> AsSerializableEnumerable()
		{
			return Configs;
		}
	}
}
`
	return temp

}

export class ExportUnityMMPPlugin extends PluginBase {
	name = "mmp"
	tags: string[] = ["mmp"]

	handleSheet(paras: HandleSheetParams) {
		var fullName = `${paras.table.workbookName}-${paras.name}`
		{
			let content1 = exportMMP(paras)
			if (content1 != null) {
				let savePath = new OutFilePath(paras.outPath, fullName, "MMP.cs").fullPath
				outputFileSync(savePath, content1, "utf-8")
			}
		}
	}
}
