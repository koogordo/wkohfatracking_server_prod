import * as socketIo from 'socket.io';
import { createServer, Server } from 'http';
import { ClientSession } from './ClientSession';
import { WKODbAccess } from '../data/WKODbAccess';
import { IdbConfig } from '../data/Database';
import { IWKOVisitEditPermission } from './WKOCommunication';
export class WKOSocket {
    private static ID = 0;
    private io!: socketIo.Server;
    private dboConfig!: IdbConfig;
    private connections!: Map<string, ClientSession>;
    private _visitEditPermissionsList!: any[];
    constructor(server: Server) {
        const allowedOrigins = '*:*';
        this.io = socketIo.listen(server, {
            origins: allowedOrigins,
            pingTimeout: 60000,
        });
        this.socketMiddleware();
        this.listenIncoming();
        this.connections = new Map();
        this._visitEditPermissionsList = [];
    }
    public socketInstance() {
        return this.io;
    }
    public dboConfiguration(config: IdbConfig) {
        this.dboConfig = config;
    }

    public clientManifest(): Map<string, ClientSession> {
        return this.connections;
    }
    public findSession(uid: string) {
        if (
            this.connections.has(uid) &&
            this.connections.get(uid) !== undefined
        ) {
            return this.connections.get(uid) as ClientSession;
        } else {
            return null;
        }
    }
    public registerPermission(permission: IWKOVisitEditPermission) {
        this._visitEditPermissionsList.push(permission);
    }
    public unregisterPermission(permission: IWKOVisitEditPermission) {
        const delIndex = this._visitEditPermissionsList.findIndex(p => {
            return p.token === permission.token;
        });
        if (delIndex > -1) {
            this._visitEditPermissionsList.splice(delIndex, 1);
        }
    }
    public visitEditPermisionsList() {
        return this._visitEditPermissionsList;
    }
    private listenIncoming(): void {
        this.io.on('connect', (socket: socketIo.Socket) => {
            const user = socket.handshake.query.user;
            const dao: WKODbAccess = new WKODbAccess(this.dboConfig);
            const newConn: ClientSession = new ClientSession(
                user,
                socket,
                dao,
                this
            );
            this.registerClient(user, newConn);
        });
    }
    private socketMiddleware() {
        this.io.use((socket, next) => {
            if (socket.handshake.query.user) {
                return next();
            }
            next(new Error('Authentication Error'));
        });
    }
    private registerClient(id: string, clientSession: ClientSession): void {
        if (!this.connections.has(id)) {
            this.connections.set(id, clientSession);
        } else {
            this.connections.delete(id);
            this.connections.set(id, clientSession);
        }
    }
}
