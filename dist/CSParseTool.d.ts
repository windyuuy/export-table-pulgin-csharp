import { Field, FieldType, DataTable } from "export-table-lib";
export declare function TryConvValue(value: any, t: FieldType, f: Field): any;
export declare function ConvValue(value: any, t: FieldType, f: Field): any;
export declare function ConvValue2Literal(value: any, t: FieldType, f: Field): string;
export declare let isSkipExportDefaults0: boolean;
export declare let firstLetterUpper: (str: string) => string;
export declare let firstLetterLower: (str: string) => string;
export declare let convMemberName: (str: string) => string;
export declare let convVarName: (str: string) => string;
export declare let getFieldType: (f: Field) => FieldType | "Dictionary<string,string>" | "List<Dictionary<string,string>>" | "double" | "double[]";
export declare let getFkFieldType: (tables: DataTable[], field: Field) => FieldType;
export declare const genValue: (value: any, f: Field) => string;
export declare const getTitle: (v: Field) => string;
export declare const getDescripts: (v: Field) => string[];
export declare const convTupleArrayType: (f: Field) => string;
//# sourceMappingURL=CSParseTool.d.ts.map