import { IAppConfig, WKOServer } from "./server/WKOServer";
import { WKOSocket } from "./server/WKOSocket";
import { IdbConfig } from "./data/Database";
import {AppConfig, DbConfig} from "./config";
const config: IAppConfig = {
    host: "localhost",
    middleware: [],
    port: 3000,
};
const wkoInstance = new WKOServer(AppConfig);
const socketServer = new WKOSocket(wkoInstance.serverInstance());
socketServer.dboConfiguration(DbConfig);
wkoInstance.attachSocket(socketServer);
export const WKOServerInstance = wkoInstance;
