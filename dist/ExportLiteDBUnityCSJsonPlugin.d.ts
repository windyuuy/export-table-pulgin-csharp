import { HandleSheetParams, PluginBase, HandleBatchParams } from "export-table-lib";
export declare function exportUJson(paras: HandleSheetParams): string | null;
export declare function exportUJsonLoader(paras: HandleSheetParams): string | null;
export declare function RemoveJsonFiles(savePaths2: string[]): Promise<void>;
export declare function ConvJson2LiteDB(litedbpath: string, savePaths: string[]): Promise<void>;
export declare class ExportLiteDBUJsonPlugin extends PluginBase {
    name: string;
    tags: string[];
    handleSheet(paras: HandleSheetParams): string | null;
    handleBatch(paras: HandleBatchParams): void;
}
//# sourceMappingURL=ExportLiteDBUnityCSJsonPlugin.d.ts.map