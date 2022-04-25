import { HandleSheetParams, PluginBase } from "export-table-lib";
export declare function export_stuff(paras: HandleSheetParams): string | null;
export declare class ExportPlugin extends PluginBase {
    name: string;
    tags: string[];
    handleSheet(paras: HandleSheetParams): string | null;
}
export declare const ExportPlugins: ExportPlugin[];
//# sourceMappingURL=index.d.ts.map