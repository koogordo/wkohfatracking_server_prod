import { IAppConfig, WKOServer } from "./server/WKOServer";
import { WKOSocket } from "./server/WKOSocket";
import { IdbConfig } from "./data/Database";
const config: IAppConfig = {
    host: "localhost",
    middleware: [],
    port: 3000,
};
const dbConfig: IdbConfig = {
    domain: "www.hfatracking.net",
    password: "wK0mI55ghBU9pp",
    username: "koogordo",
};
const wkoInstance = new WKOServer(config);
const socketServer = new WKOSocket(wkoInstance.serverInstance());
socketServer.dboConfiguration(dbConfig);
wkoInstance.attachSocket(socketServer);

export const WKOServerInstance = wkoInstance;
