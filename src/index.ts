
import { ExportPlugin as ExportCSPlugin } from "./ExportCSPlugin"
import { ExportLiteDBCSPlugin } from "./ExportLiteDBCSPlugin"
import { ExportLiteDBUJsonPlugin } from "./ExportLiteDBUnityCSJsonPlugin"
import { ExportUJsonPlugin } from "./ExportUnityCSJsonPlugin"
import { ExportUnityMMPPlugin } from "./ExportUnityMMPPlugin"

export const ExportPlugins = [
	new ExportCSPlugin(),
	new ExportUJsonPlugin(),
	new ExportLiteDBCSPlugin(),
	new ExportLiteDBUJsonPlugin(),
	new ExportUnityMMPPlugin(),
]
