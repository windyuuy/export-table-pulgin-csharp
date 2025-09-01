export declare class FieldInfo {
    name: string;
    isArray: boolean;
    type: string;
    csName: string;
    csType: string;
    setName(n: string): void;
    setType(t: string, isArray: boolean): void;
    getFieldType(): string;
}
export declare class ClassInfo {
    name: string;
    type: "class" | "enum";
    fields: FieldInfo[];
    getFieldInfo(fieldName: string): FieldInfo | undefined;
}
export declare class CSProtoParser {
    typeMap: Map<string, ClassInfo>;
    parseProtoFile(filePath: string): void;
    getClassInfo(className: string): ClassInfo | undefined;
}
//# sourceMappingURL=CSProtoParser.d.ts.map