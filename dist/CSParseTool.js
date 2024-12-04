"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMMPNamespace = exports.isEnableMMP = exports.GetUsingJsonToolNamespace = exports.convTupleArrayTypeDefine = exports.convTupleArrayType = exports.getDescripts = exports.getTitle = exports.genValue = exports.getFkFieldType = exports.getCustomFieldTypeAnnotation = exports.getFieldAnnotation = exports.isTypeArray = exports.getFieldType = exports.getFieldElementType = exports.convVarName = exports.convMemberName = exports.firstLetterLower = exports.firstLetterUpper = exports.isSkipExportDefaults0 = exports.ConvValue2Literal = exports.ToNewTupleStatement = exports.genTupleArrayValue = exports.ConvValue = exports.TryConvValue = void 0;
const export_table_lib_1 = require("export-table-lib");
function TryConvValue(value, t, f) {
    try {
        return ConvValue(value, t, f);
    }
    catch (ex) {
        if (ex instanceof TypeError) {
            console.error(ex);
            return null;
        }
        else {
            return null;
        }
    }
}
exports.TryConvValue = TryConvValue;
function ConvValue(value, t, f) {
    if (t == "object") {
        return JSON.parse(value);
    }
    else if (t == "object[]") {
        return JSON.parse(value);
    }
    else if (t == "number" || t == "float") {
        return JSON.parse(value);
    }
    else if (t == "int" || t == "long") {
        return parseInt(value);
    }
    else if (t == "number[]" || t == "float[]") {
        return JSON.parse(value);
    }
    else if (t == "int[]") {
        return JSON.parse(value);
    }
    else if (t == "long[]") {
        return JSON.parse(value);
    }
    else if (t == "uid") {
        return JSON.parse(value);
    }
    else if (t == "bool") {
        try {
            return !!JSON.parse(value);
        }
        catch (ex) {
            console.log(ex);
            return false;
        }
    }
    else if (t == "bool[]") {
        return JSON.parse(value);
    }
    else if (t == "string") {
        return value;
    }
    else if (t == "string[]") {
        return JSON.parse(value);
    }
    else if (t == "fk") {
        return value;
    }
    else if (t == "fk[]") {
        return value;
    }
    else if (t == "any") {
        console.log(f);
        throw new TypeError(`invalid type ${f.name}:<${f.rawType} => any>`);
    }
    else if (t == "key") {
        return JSON.parse(t);
    }
    throw new TypeError(`invalid unkown type ${f.name}:<${f.rawType} => ${f.type} << ${t}>`);
}
exports.ConvValue = ConvValue;
function genTupleArrayValue(f, content) {
    var line = f.rawType.replaceAll(/(?<=[^\w])(boolean)(?=[^\w]|$)/g, "bool");
    let m = line.match(/\@\((\w+),(\w+)\)(\[\])?/);
    if (m != null) {
        // [{"Item1":99,"Item2":"klwjefl"}]
        let index = 0;
        let objs = [];
        let isArray = false;
        // console.log(`input: ${content}`)
        while (0 <= index && index < content.length) {
            let segIndex = content.indexOf(";;", index);
            if (segIndex == -1) {
                segIndex = content.length;
            }
            let index2 = content.indexOf("|", index);
            if (index2 == -1 || index2 >= segIndex) {
                if (content.length > 0) {
                    console.error(`表格格式错误，缺少部分数据，将用默认值填充<${f.name}>: ${content}`);
                }
                index2 = segIndex;
            }
            let numStr = content.substring(index, index2);
            let t1 = m[1];
            let v1 = index == index2 ? undefined : TryConvValue(numStr, t1, f);
            // console.log(`parseinfo1: ${content}, ${index}, ${index2}, ${numStr}, ${t1}, ${v1}`)
            let index3 = Math.min(index2 + 1, segIndex);
            let ssStr = content.substring(index3, segIndex);
            let t2 = m[2];
            let v2 = index3 == segIndex ? undefined : TryConvValue(ssStr, t2, f);
            // console.log(`parseinfo2: ${content}, ${index3}, ${segIndex}, ${ssStr}, ${t2}, ${v2}`)
            let obj = {};
            if (v1 != undefined) {
                obj.Item1 = v1;
            }
            if (v2 != undefined) {
                obj.Item2 = v2;
            }
            objs.push(obj);
            if (segIndex >= content.length) {
                break;
            }
            index = segIndex + 2;
        }
        isArray = m[3] == "[]";
        return { isArray, objs };
    }
    return undefined;
}
exports.genTupleArrayValue = genTupleArrayValue;
function ToNewTupleStatement(obj) {
    return `new(){${(0, export_table_lib_1.iff)(obj.Item1 != null, () => `Item1=${obj.Item1},`)}${(0, export_table_lib_1.iff)(obj.Item2 != null, () => `Item2=${obj.Item2},`)}}`;
}
exports.ToNewTupleStatement = ToNewTupleStatement;
function ConvValue2Literal(value, t, f) {
    // console.log(t)
    if (t == "object") {
        //throw new Error("invalid type <object>")
        let convert = [];
        for (let k in value) {
            convert.push(`{"${k}","${value[k].toString()}"}`);
        }
        ;
        return `new Dictionary<string,string>(${convert.length}){${convert}}`;
    }
    else if (t == "object[]") {
        let values = value;
        //throw new Error("invalid type <object[]>")
        return `new List<Dictionary<string,string>>(){${values.map((val) => {
            let convert = [];
            for (let k in val) {
                convert.push(`{"${k}","${val[k].toString()}"}`);
            }
            ;
            return `new Dictionary<string,string>(${convert.length}){${convert}}`;
        })}}`;
    }
    else if (t == "number" || t == "int" || t == "long") {
        return `${value}`;
    }
    else if (t == "number[]") {
        let values = value;
        return `new double[]{${values.join(", ")}}`;
    }
    else if (t == "float[]") {
        let values = value;
        return `new float[]{${values.join(", ")}}`;
    }
    else if (t == "int[]") {
        let values = value;
        return `new int[]{${values.join(", ")}}`;
    }
    else if (t == "long[]") {
        let values = value;
        return `new long[]{${values.join(", ")}}`;
    }
    else if (t == "uid") {
        return `${value}`;
    }
    else if (t == "bool") {
        return `${value}`;
    }
    else if (t == "bool[]") {
        let values = value;
        return `new bool[]{${values.join(", ")}}`;
    }
    else if (t == "string") {
        // return `"${value}"`
        return JSON.stringify(value);
    }
    else if (t == "string[]") {
        let values = value;
        return `new string[]{${values.map(v => JSON.stringify(v)).join(", ")}}`;
    }
    else if (t.startsWith("WritableValueTuple<")) {
        let result = genTupleArrayValue(f, value);
        // console.log(`result: ${value}=> ${JSON.stringify(result)}`)
        if (result == null) {
            throw new Error(`invalid tuple/tuple[] format: ${value}`);
        }
        let { isArray, objs } = result;
        if (isArray) {
            return `new ${f.type}{${(0, export_table_lib_1.foreach)(objs, obj => ToNewTupleStatement(obj), ",")}}`;
        }
        else {
            let obj = objs[0] ?? {};
            return ToNewTupleStatement(obj);
        }
    }
    else if (t == "fk") {
        return `${value}`;
    }
    else if (t == "fk[]") {
        let values = value;
        return `new int[]{${values.join(", ")}}`;
    }
    else if (t == "any") {
        console.log(f);
        throw new Error(`invalid type ${f.name}:<${f.rawType} | ${f.type} => any>`);
    }
    else if (t == "key") {
        return `${value}`;
    }
    throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`);
}
exports.ConvValue2Literal = ConvValue2Literal;
exports.isSkipExportDefaults0 = process.argv.findIndex(v => v == "--SkipDefaults") >= 0;
let firstLetterUpper = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.firstLetterUpper = firstLetterUpper;
let firstLetterLower = function (str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
};
exports.firstLetterLower = firstLetterLower;
let convMemberName = function (str) {
    return str.split("_").map(s => (0, exports.firstLetterUpper)(s)).join("");
};
exports.convMemberName = convMemberName;
exports.convVarName = exports.firstLetterLower;
let getFieldElementType = function (f) {
    let t = f.type;
    if (t.endsWith("[]")) {
        var type = (0, exports.getFieldType)(f);
        return type.substring(0, type.length - 2);
    }
    else if (t == "any") {
        console.log(f);
        throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`);
    }
    else if (t == "key") {
        return "string";
    }
    else {
        throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`);
    }
    return t;
};
exports.getFieldElementType = getFieldElementType;
let getFieldType = function (f) {
    let t = f.type;
    if (t == "object") {
        //throw new Error("invalid type <Dictionary<string,string>>")
        return "Dictionary<string,string>";
    }
    else if (t == "object[]") {
        //throw new Error("invalid type <Dictionary<string,string>[]>")
        return "List<Dictionary<string,string>>";
    }
    else if (t == "number") {
        return "double";
    }
    else if (t == "number[]") {
        return "double[]";
    }
    else if (t == "float") {
        return "float";
    }
    else if (t == "float[]") {
        return "float[]";
    }
    else if (t == "int") {
        return "int";
    }
    else if (t == "int[]") {
        return "int[]";
    }
    else if (t == "long") {
        return "long";
    }
    else if (t == "long[]") {
        return "long[]";
    }
    else if (t == "uid") {
        return "int";
    }
    else if (t == "bool") {
        return "bool";
    }
    else if (t == "bool[]") {
        return "bool[]";
    }
    else if (t == "string") {
        return "string";
    }
    else if (t == "string[]") {
        return "string[]";
    }
    else if (t == "fk") {
        return "int";
    }
    else if (t == "fk[]") {
        return "int[]";
    }
    else if (t.startsWith("WritableValueTuple<")) {
        return t;
    }
    else if (t == "any") {
        console.log(f);
        throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`);
    }
    else if (t == "key") {
        return "string";
    }
    else {
        throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`);
    }
    return t;
};
exports.getFieldType = getFieldType;
let isTypeArray = function (f) {
    let t = f.type;
    let isArray = t.endsWith("[]");
    return isArray;
};
exports.isTypeArray = isTypeArray;
let getFieldAnnotation = function (f) {
    let anno = '[MarshalAs(UnmanagedType.ByValArray, SizeConst = 0)]';
    let t = f.type;
    if (t == "object") {
        return "";
    }
    else if (t == "object[]") {
        //throw new Error("invalid type <Dictionary<string,string>[]>")
        return "";
    }
    else if (t == "number") {
        return "";
    }
    else if (t == "number[]") {
        return anno;
    }
    else if (t == "float") {
        return "";
    }
    else if (t == "float[]") {
        return anno;
    }
    else if (t == "int") {
        return "";
    }
    else if (t == "int[]") {
        return anno;
    }
    else if (t == "long") {
        return "";
    }
    else if (t == "long[]") {
        return anno;
    }
    else if (t == "uid") {
        return "";
    }
    else if (t == "bool") {
        return "";
    }
    else if (t == "bool[]") {
        return anno;
    }
    else if (t == "string") {
        return "";
    }
    else if (t == "string[]") {
        return anno;
    }
    else if (t == "fk") {
        return "";
    }
    else if (t == "fk[]") {
        return anno;
    }
    else if (t == "any") {
        console.log(f);
        throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`);
    }
    else if (t == "key") {
        return "string";
    }
    else {
        throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`);
    }
    return t;
};
exports.getFieldAnnotation = getFieldAnnotation;
let getCustomFieldTypeAnnotation = function (f) {
    let anno = '[MarshalAs(UnmanagedType.ByValArray, SizeConst = 0)]';
    let t = f.type;
    if (t == "string") {
        if (f.rawType.endsWith("[]")) {
            return anno;
        }
        return "";
    }
    else if (t == "any") {
        console.log(f);
        throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`);
    }
    else if (t == "key") {
        return "string";
    }
    else {
        throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`);
    }
    return t;
};
exports.getCustomFieldTypeAnnotation = getCustomFieldTypeAnnotation;
let getFkFieldType = function (tables, field) {
    return tables.find(a => a.name == field.fkTableName).fields.find(a => a.name == field.fkFieldName).type;
};
exports.getFkFieldType = getFkFieldType;
const genValue = (value, f) => {
    return ConvValue2Literal(value, f.type, f);
};
exports.genValue = genValue;
const getTitle = (v) => {
    return v.describe.split("\n")[0];
};
exports.getTitle = getTitle;
const getDescripts = (v) => {
    return v.describe.split("\n");
};
exports.getDescripts = getDescripts;
const convTupleArrayType = (f) => {
    let line0 = f.rawType.replaceAll(/(?<=[^\w])(number)(?=[^\w]|$)/g, "double").replaceAll(/(?<=[^\w])(boolean)(?=[^\w]|$)/g, "bool");
    let m = line0.match(/\@\((\w+),(\w+)\)(\[\])?/);
    if (m != null) {
        let type1 = m[1];
        let type2 = m[2];
        let isArray = m[3] != null;
        let type = `WritableValueTuple<${type1}, ${type2}>${isArray ? "[]" : ""}`;
        let name = `${(0, exports.convMemberName)(f.name)}Obj`;
        let f2 = { ...f, type, name };
        return f2;
    }
    else {
        return undefined;
    }
};
exports.convTupleArrayType = convTupleArrayType;
const convTupleArrayTypeDefine = (f) => {
    let line0 = f.rawType.replaceAll(/(?<=[^\w])(number)(?=[^\w]|$)/g, "double").replaceAll(/(?<=[^\w])(boolean)(?=[^\w]|$)/g, "bool");
    let m = line0.match(/\@\((\w+),(\w+)\)(\[\])?/);
    if (m != null) {
        let type1 = m[1];
        let type2 = m[2];
        let isArray = m[3] != null;
        let line = `public WritableValueTuple<${type1}, ${type2}>${isArray ? "[]" : ""} ${(0, exports.convMemberName)(f.name)}Obj;`;
        return line;
    }
    else {
        return `public ${line0}  ${(0, exports.convMemberName)(f.name)}Obj;`;
    }
};
exports.convTupleArrayTypeDefine = convTupleArrayTypeDefine;
function GetUsingJsonToolNamespace() {
    let jsonToolNamespaceIndex = process.argv.findIndex(v => v == "--AssetToolNamespace");
    let jsonToolNamespace = null;
    if (jsonToolNamespaceIndex >= 0 && process.argv.length > jsonToolNamespaceIndex + 1) {
        jsonToolNamespace = process.argv[jsonToolNamespaceIndex + 1];
    }
    let useJsonToolNamesapce = jsonToolNamespace != null ? `using ${jsonToolNamespace};` : ``;
    return useJsonToolNamesapce;
}
exports.GetUsingJsonToolNamespace = GetUsingJsonToolNamespace;
exports.isEnableMMP = process.argv.findIndex(v => v == "--EnableMMPB") >= 0;
exports.useMMPNamespace = "using LoadTableMMP.Runtime;";
