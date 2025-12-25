"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportUnityMMPPlugin = void 0;
exports.exportMMP = exportMMP;
const export_table_lib_1 = require("export-table-lib");
const CSParseTool_1 = require("./CSParseTool");
var isEnableMMPB = process.argv.findIndex(v => v == "--EnableMMPB") >= 0;
let firstLetterUpper = export_table_lib_1.makeFirstLetterUpper;
function exportMMP(paras) {
    let { datas, fields, name, objects, table, exportNamespace, } = paras;
    let RowClass = firstLetterUpper(name);
    var fullName = `${table.workbookName}-${name}`;
    var mmpMark = "[System.Runtime.InteropServices.StructLayout(LayoutKind.Sequential, Pack = 4, CharSet = CharSet.Ansi)]";
    // TODO: 支持FK类型
    let temp = `
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
${CSParseTool_1.useMMPNamespace}

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
${(0, export_table_lib_1.foreach)(fields, f => `
${(0, export_table_lib_1.iff)(f.type == "string[]", () => `
			var ${(0, CSParseTool_1.convVarName)(f.name)} = this.${(0, CSParseTool_1.convMemberName)(f.name)}; this.${(0, CSParseTool_1.convMemberName)(f.name)} = null;
`)}
`)}
			Marshal.StructureToPtr(this, paras.Ptr, false);
${(0, export_table_lib_1.foreach)(fields, f => `
${(0, export_table_lib_1.iff)(f.type == "string[]", () => `
			this.${(0, CSParseTool_1.convMemberName)(f.name)} = ${(0, CSParseTool_1.convVarName)(f.name)};
`)}
`)}
			paras.Offset += GetTypeSize();
${(0, export_table_lib_1.foreach)(fields, f => `
${(0, export_table_lib_1.iff)(f.type == "string", () => `
			// ${f.name}
			BitUtils.FromString(ref paras, this.${(0, CSParseTool_1.convMemberName)(f.name)});
${(0, export_table_lib_1.iff)(f.rawType.startsWith("@") && f.rawType.endsWith("[]"), () => `
			BitUtils.FromSArray(ref paras, this.${(0, CSParseTool_1.convMemberName)(f.name)}Obj);
`)}
`).elseif(f.type == "string[]", () => `
			// ${f.name}
			BitUtils.FromArray(ref paras, this.${(0, CSParseTool_1.convMemberName)(f.name)}, BitUtils.FromString);
`).elseif((0, CSParseTool_1.isTypeArray)(f), () => `
			// ${f.name}
			BitUtils.FromRawArray(ref paras, this.${(0, CSParseTool_1.convMemberName)(f.name)});
`).else(() => `
`)}
`, "\n")}
		}

		public void Deserialize(ref DeserializeParas paras)
		{
			Marshal.PtrToStructure(paras.Ptr, this);
			paras.Offset += GetTypeSize();
${(0, export_table_lib_1.foreach)(fields, f => `
${(0, export_table_lib_1.iff)(f.type == "string", () => `
			// ${f.name}
			this.${(0, CSParseTool_1.convMemberName)(f.name)} = BitUtils.ToString(ref paras);
${(0, export_table_lib_1.iff)(f.rawType.startsWith("@") && f.rawType.endsWith("[]"), () => `
			BitUtils.ToSArray(ref paras, ref this.${(0, CSParseTool_1.convMemberName)(f.name)}Obj);
`)}
`).elseif(f.type == "string[]", () => `
			// ${f.name}
			this.${(0, CSParseTool_1.convMemberName)(f.name)} = BitUtils.ToArray(ref paras, BitUtils.ToString);
`).elseif((0, CSParseTool_1.isTypeArray)(f), () => `
			// ${f.name}
			this.${(0, CSParseTool_1.convMemberName)(f.name)} = BitUtils.ToRawArray<${(0, CSParseTool_1.getFieldElementType)(f)}>(ref paras);
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
`;
    return temp;
}
class ExportUnityMMPPlugin extends export_table_lib_1.PluginBase {
    name = "mmp";
    tags = ["mmp"];
    handleSheet(paras) {
        var fullName = `${paras.table.workbookName}-${paras.name}`;
        {
            let content1 = exportMMP(paras);
            if (content1 != null) {
                let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, "MMP.cs").fullPath;
                (0, CSParseTool_1.outputFileSync)(savePath, content1, "utf-8");
            }
        }
    }
}
exports.ExportUnityMMPPlugin = ExportUnityMMPPlugin;
