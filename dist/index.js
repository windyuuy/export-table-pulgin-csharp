"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPlugins = void 0;
const ExportCSPlugin_1 = require("./ExportCSPlugin");
const ExportLiteDBCSPlugin_1 = require("./ExportLiteDBCSPlugin");
const ExportLiteDBUnityCSJsonPlugin_1 = require("./ExportLiteDBUnityCSJsonPlugin");
const ExportUnityCSJsonPlugin_1 = require("./ExportUnityCSJsonPlugin");
exports.ExportPlugins = [
    new ExportCSPlugin_1.ExportPlugin(),
    new ExportUnityCSJsonPlugin_1.ExportUJsonPlugin(),
    new ExportLiteDBCSPlugin_1.ExportLiteDBCSPlugin(),
    new ExportLiteDBUnityCSJsonPlugin_1.ExportLiteDBUJsonPlugin(),
];
