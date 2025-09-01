import * as fs from 'fs-extra';
import { firstLetterLower } from './CSParseTool';

let fieldTypeMap: { [key: string]: string } = {
    ["float"]: "float",
    ["double"]: "double",
    ["int32"]: "int",
    ["bool"]: "bool",
    ["bytes"]: "byte[]",
}
export class FieldInfo {
    name: string = ""
    isArray: boolean = false
    type: string = ""
    csName: string = ""
    csType: string = ""

    setName(n: string) {
        this.name = n

        this.csName = firstLetterLower(this.name.split("_")
            .map(t => t.slice(0, 1).toUpperCase() + t.slice(1))
            .join(""))
    }
    setType(t: string) {
        this.type = t;

        let internalType = fieldTypeMap[this.type]
        if (internalType != undefined) {
            this.csType = internalType
        } else {
            this.csType = t
        }
    }

    getFieldType() {
        return this.csType
    }
}

export class ClassInfo {
    name: string = ""
    type: "class" | "enum" = "class"
    fields: FieldInfo[] = []

    getFieldInfo(fieldName: string) {
        return this.fields.find(field => field.csName == fieldName)
    }

}

export class CSProtoParser {
    typeMap: Map<string, ClassInfo> = new Map();
    parseProtoFile(filePath: string) {
        let content = fs.readFileSync(filePath, "utf-8");
        let curClass: ClassInfo | null = null
        let codeLines = content.split("\n")
        let messageRegex = /message (\w+)/
        let enumRegex = /enum (\w+)/
        let structEndRegex = /^\}/
        let fieldRegex = /(?:(repeated) )?(\w+) (\w+)\s*=\s*\d+;/
        let codeLinesLen = codeLines.length
        let isInClass = false;
        for (let i = 0; i < codeLinesLen; i++) {
            let line = codeLines[i]
            if (!isInClass) {
                // check enter class
                while (true) {
                    let m1 = line.match(messageRegex)
                    if (m1) {
                        let className = m1[1]
                        curClass = new ClassInfo()
                        console.log(`find class: ${className}`)
                        curClass.name = className
                        curClass.type = "class"
                        this.typeMap.set(className, curClass)
                        isInClass = true
                        break
                    }
                    let m2 = line.match(enumRegex)
                    if (m2) {
                        let enumName = m2[1]
                        curClass = new ClassInfo()
                        curClass.name = enumName
                        curClass.type = "enum"
                        this.typeMap.set(enumName, curClass)
                        isInClass = true
                        break
                    }
                    break
                }
            } else {
                // check leave class
                let m3 = line.match(structEndRegex)
                if (m3) {
                    curClass = null
                    isInClass = false;
                } else {
                    // parse class fields
                    let mField = line.match(fieldRegex)
                    if (mField) {
                        let isArray = mField[1] == "repeated"
                        let fieldType = mField[2]
                        let fieldName = mField[3]
                        let field = new FieldInfo()
                        field.setName(fieldName)
                        field.setType(fieldType)
                        field.isArray = isArray
                        curClass!.fields.push(field)
                        console.log(`find field: ${field.csName}, ${field.csType}, ${curClass!.fields.length}`)
                    }
                }
            }
        }
    }

    getClassInfo(className: string) {
        return this.typeMap.get(className)
    }
}
