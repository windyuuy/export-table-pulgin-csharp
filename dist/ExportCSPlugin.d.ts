import { HandleSheetParams, Field, PluginBase, FieldType } from "export-table-lib";
export declare function TryConvValue(value: any, t: FieldType, f: Field): any;
export declare function ConvValue(value: any, t: FieldType, f: Field): any;
export declare function ConvValue2Literal(value: any, t: FieldType, f: Field): string;
export declare function export_stuff(paras: HandleSheetParams): string | null;
export declare class ExportPlugin extends PluginBase {
    name: string;
    tags: string[];
    handleSheet(paras: HandleSheetParams): string | null;
}
//# sourceMappingURL=ExportCSPlugin.d.ts.map