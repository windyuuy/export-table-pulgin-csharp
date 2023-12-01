
import { ExportPlugin as ExportCSPlugin } from "./ExportCSPlugin"
import { ExportLiteDBCSPlugin } from "./ExportLiteDBCSPlugin"
import { ExportLiteDBUJsonPlugin } from "./ExportLiteDBUnityCSJsonPlugin"
import { ExportUJsonPlugin } from "./ExportUnityCSJsonPlugin"

export const ExportPlugins = [
	new ExportCSPlugin(),
	new ExportUJsonPlugin(),
	new ExportLiteDBCSPlugin(),
	new ExportLiteDBUJsonPlugin(),
]
