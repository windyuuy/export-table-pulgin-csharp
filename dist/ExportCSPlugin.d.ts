import { HandleSheetParams, PluginBase, HandleBatchParams } from "export-table-lib";
export declare function export_stuff(paras: HandleSheetParams): string | null;
export declare class ExportPlugin extends PluginBase {
    name: string;
    tags: string[];
    handleBatch(paras: HandleBatchParams): void;
    handleSheet(paras: HandleSheetParams): string | null;
}
//# sourceMappingURL=ExportCSPlugin.d.ts.map