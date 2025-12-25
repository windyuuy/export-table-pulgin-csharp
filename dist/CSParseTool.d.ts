import { Field, FieldType, DataTable } from "export-table-lib";
export declare function TryConvValue(value: any, t: FieldType, f: Field): any;
export declare function ConvValue(value: any, t: FieldType, f: Field): any;
export type ValueTuple = {
    Item1?: any;
    Item2?: any;
};
export declare function genTupleArrayValue(f: Field, content: string): {
    isArray: boolean;
    objs: ValueTuple[];
} | undefined;
export declare function ToNewTupleStatement(obj: ValueTuple): string;
export declare function ConvValue2Literal(value: any, t: FieldType, f: Field): string;
export declare let isSkipExportDefaults0: boolean;
export declare let isOverwriteWithProto: boolean;
export declare let overwriteWithProtoPath: string;
export declare let firstLetterUpper: (str: string) => string;
export declare let firstLetterLower: (str: string) => string;
export declare let convMemberName: (str: string) => string;
export declare let convVarName: (str: string) => string;
export declare let getFieldElementType: (f: Field) => string;
export declare let getFieldType: (f: Field) => FieldType | "Dictionary<string,string>" | "List<Dictionary<string,string>>" | "double" | "double[]";
export declare let isTypeArray: (f: Field) => boolean;
export declare let getFieldAnnotation: (f: Field) => string;
export declare let getCustomFieldTypeAnnotation: (f: Field) => string;
export declare let getFkFieldType: (tables: DataTable[], field: Field) => FieldType;
export declare const genValue: (value: any, f: Field) => string;
export declare const getTitle: (v: Field) => string;
export declare const getDescripts: (v: Field) => string[];
export declare const convTupleArrayType: (f: Field) => Field | undefined;
export declare const convTupleArrayTypeDefine: (f: Field) => string;
export declare function GetUsingJsonToolNamespace(): string;
export declare let isEnableMMP: boolean;
export declare let useMMPNamespace: string;
export declare function outputFileSync(savePath: string, content1: any, options: BufferEncoding): void;
//# sourceMappingURL=CSParseTool.d.ts.map