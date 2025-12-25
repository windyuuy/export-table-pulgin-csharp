"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSProtoParser = exports.ClassInfo = exports.FieldInfo = void 0;
const fs = __importStar(require("fs-extra"));
const CSParseTool_1 = require("./CSParseTool");
let fieldTypeMap = {
    ["float"]: "float",
    ["double"]: "double",
    ["int32"]: "int",
    ["bool"]: "bool",
    ["bytes"]: "byte[]",
};
class FieldInfo {
    name = "";
    isArray = false;
    type = "";
    csName = "";
    csType = "";
    setName(n) {
        this.name = n;
        this.csName = (0, CSParseTool_1.firstLetterLower)(this.name.split("_")
            .map(t => t.slice(0, 1).toUpperCase() + t.slice(1))
            .join(""));
    }
    setType(t, isArray) {
        this.isArray = isArray;
        this.type = t;
        let internalType = fieldTypeMap[this.type];
        if (internalType != undefined) {
            this.csType = this.isArray ? `${internalType}[]` : internalType;
        }
        else {
            this.csType = this.isArray ? `${t}[]` : t;
        }
    }
    getFieldType() {
        return this.csType;
    }
}
exports.FieldInfo = FieldInfo;
class ClassInfo {
    name = "";
    type = "class";
    fields = [];
    getFieldInfo(fieldName) {
        return this.fields.find(field => field.csName == fieldName);
    }
}
exports.ClassInfo = ClassInfo;
class CSProtoParser {
    typeMap = new Map();
    parseProtoFile(filePath) {
        let content = fs.readFileSync(filePath, "utf-8");
        let classMeta = new ClassInfo();
        let curClass = null;
        let codeLines = content.split("\n");
        let classMapperRegex = /\/\/\!Mapper\((\w+)\)/;
        let messageRegex = /message (\w+)/;
        let enumRegex = /enum (\w+)/;
        let structEndRegex = /^\}/;
        let fieldRegex = /(?:(repeated) )?(\w+) (\w+)\s*=\s*\d+;/;
        let codeLinesLen = codeLines.length;
        let isInClass = false;
        for (let i = 0; i < codeLinesLen; i++) {
            let line = codeLines[i];
            if (!isInClass) {
                // check enter class
                while (true) {
                    let mMapper = line.match(classMapperRegex);
                    if (mMapper) {
                        let mapName = mMapper[1];
                        classMeta.name = mapName;
                        console.log(`mapper: ${mapName}`);
                    }
                    let m1 = line.match(messageRegex);
                    if (m1) {
                        let className = m1[1];
                        curClass = new ClassInfo();
                        // console.log(`find class: ${className}`)
                        curClass.name = className;
                        curClass.type = "class";
                        if (classMeta.name != "") {
                            this.typeMap.set(classMeta.name, curClass);
                        }
                        else {
                            this.typeMap.set(className, curClass);
                        }
                        isInClass = true;
                        break;
                    }
                    let m2 = line.match(enumRegex);
                    if (m2) {
                        let enumName = m2[1];
                        curClass = new ClassInfo();
                        curClass.name = enumName;
                        curClass.type = "enum";
                        if (classMeta.name != "") {
                            this.typeMap.set(classMeta.name, curClass);
                        }
                        else {
                            this.typeMap.set(enumName, curClass);
                        }
                        isInClass = true;
                        break;
                    }
                    break;
                }
            }
            else {
                // check leave class
                let m3 = line.match(structEndRegex);
                if (m3) {
                    curClass = null;
                    classMeta.name = "";
                    isInClass = false;
                }
                else {
                    // parse class fields
                    let mField = line.match(fieldRegex);
                    if (mField) {
                        let isArray = mField[1] == "repeated";
                        let fieldType = mField[2];
                        let fieldName = mField[3];
                        let field = new FieldInfo();
                        field.setName(fieldName);
                        field.setType(fieldType, isArray);
                        curClass.fields.push(field);
                        // console.log(`find field: ${field.csName}, ${field.csType}, ${field.isArray}`)
                    }
                }
            }
        }
    }
    getClassInfo(className) {
        return this.typeMap.get(className);
    }
}
exports.CSProtoParser = CSProtoParser;
