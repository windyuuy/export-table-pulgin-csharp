"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convTupleArrayType = exports.getDescripts = exports.getTitle = exports.genValue = exports.getFkFieldType = exports.getFieldType = exports.convVarName = exports.convMemberName = exports.firstLetterLower = exports.firstLetterUpper = exports.isSkipExportDefaults0 = exports.ConvValue2Literal = exports.ConvValue = exports.TryConvValue = void 0;
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
function ConvValue2Literal(value, t, f) {
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
    else if (t == "fk") {
        return `${value}`;
    }
    else if (t == "fk[]") {
        let values = value;
        return `new int[]{${values.join(", ")}}`;
    }
    else if (t == "any") {
        console.log(f);
        throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`);
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
    console.log(line0);
    let m = line0.match(/\@\((\w+),(\w+)\)(\[\])?/);
    if (m != null) {
        let type1 = m[1];
        let type2 = m[2];
        let isArray = m[3] != null;
        let line = `public System.Tuple<${type1}, ${type2}>${isArray ? "[]" : ""} ${(0, exports.convMemberName)(f.name)}Obj;`;
        return line;
    }
    else {
        return `public ${line0}  ${(0, exports.convMemberName)(f.name)}Obj;`;
    }
};
exports.convTupleArrayType = convTupleArrayType;
