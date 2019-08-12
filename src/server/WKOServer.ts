import express from "express";
import * as socketIo from "socket.io";
import { createServer, Server } from "http";
import { WKOSocket } from "./WKOSocket";
import { ClientSession } from "./ClientSession";
import { IdbConfig } from "../data/Database";
import cors from "cors";
export class WKOServer {
    private server!: Server;
    private app!: express.Application;
    private config!: IAppConfig;
    private socketServer!: WKOSocket;

    constructor(config: IAppConfig) {
        this.configure(config);
        this.createApp();
        this.middleWare();
        this.createServer();
    }
    public serverInstance() {
        return this.server;
    }
    public attachSocket(socket: WKOSocket) {
        this.socketServer = socket;
    }

    public start() {
        this.server.listen(this.config.port, () => {
            console.log(`SERVER IS LISTENING ON PORT ${this.config.port}`);
        });
    }
    private createApp(): void {
        this.app = express();
    }
    private createServer(): void {
        this.server = createServer(this.app);
    }
    private configure(config: IAppConfig): void {
        this.config = config;
    }
    private middleWare() {
        // this.app.use(cors());
        this.app.enable("trust proxy");
    }
}

export interface IAppConfig {
    host: string;
    port: number;
    middleware: any[];
}
