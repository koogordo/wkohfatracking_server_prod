import express from 'express';
import * as socketIo from 'socket.io';
import bodyParser from 'body-parser';
import { createServer, Server } from 'http';
import { WKOSocket } from './WKOSocket';
import { ClientSession } from './ClientSession';
import { IdbConfig } from '../data/Database';
import cors from 'cors';
import DashboardController from '../api/dashboard/DashboardController';
import AuthController from '../api/authentication/AuthController';
import UserController from '../api/user/UserController';
import VisitController from '../api/visit/VisitController';
import ArchiveController from '../api/archive/ArichiveController';
export class WKOServer {
    private server!: Server;
    private app!: express.Application;
    private config!: IAppConfig;
    private socketServer!: WKOSocket;
    constructor(config: IAppConfig) {
        this.configure(config);
        this.createApp();
        this.middleWare();
        this.apiRouting();
        this.createServer();
    }
    public serverInstance() {
        return this.server;
    }
    public attachSocket(socket: WKOSocket) {
        this.socketServer = socket;
    }
    public attachApi() {}

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
        this.app.enable('trust proxy');

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cors());
    }
    private apiRouting() {
        this.app.use('/dashboard', DashboardController);
        this.app.use('/auth', AuthController);
        this.app.use('/user', UserController);
        this.app.use('/visit', VisitController);
        this.app.use('/archive', ArchiveController);
    }
}

export interface IAppConfig {
    host: string;
    port: number;
    middleware: any[];
}
