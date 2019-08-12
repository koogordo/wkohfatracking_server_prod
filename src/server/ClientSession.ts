import * as socketIo from "socket.io";
import { WKODbAccess } from "../data/WKODbAccess";
import { CommEvent, IWKOMessage, IWKORequest, IWKONotification } from "./WKOCommunication";
import { WKOSocket } from "./WKOSocket";
import { IVisit, IUser } from "../data/Repository";
export class ClientSession {
    private socket!: socketIo.Socket;
    private dao!: WKODbAccess;
    private dispatch!: WKOSocket;
    private sessionID!: string;
    constructor(sessionID: string, socket: socketIo.Socket, dao: WKODbAccess, dispatch: WKOSocket) {
        this.socket = socket;
        this.dao = dao;
        this.dispatch = dispatch;
        this.initSocket();
    }
    public getSocket(): socketIo.Socket {
        return this.socket;
    }
    private initSocket() {
        this.socket.on("disconnect", () => {
            // TODO HANDLE CLIENT DISCONNECT
            this.dispatch.clientManifest().delete(this.sessionID);
        });
        this.socket.on(CommEvent.MESSAGE, (data: any) => {
            const wkoMessage: IWKOMessage = data as IWKOMessage;
            this.handleMessage(wkoMessage);
        });
        this.socket.on(CommEvent.REQUEST, (data: any) => {
            console.log(`Request was made by: ${data.reqUser}`);
            const wkoFormUpdate: IWKORequest = data as IWKORequest;
            this.handleRequest(wkoFormUpdate);
        });
    }

    private handleMessage(data: IWKOMessage): void {
        // TODO do something with the request data
        const s = this.dispatch.findSession(data.destination);
        if (s) {
            s.getSocket().emit(CommEvent.MESSAGE, data.body);
        }
    }

    private handleRequest(data: IWKORequest): void {
        // TODO do something with the form update;
        switch (data.action) {
            case "update":
                this.doUpdate(data);
                break;
            case "save":
                this.doDelete(data);
                break;
            case "notify":
                this.notifyRelevantUsers(data);
                break;
            default: {
                break;
            }
        }
    }

    private doUpdate(req: IWKORequest) {
        this.dao
            .visits(req.userDB)
            .update(req.visit)
            .then((res) => {
                // TODO server response
                if (req.doNotify) {
                    this.notifyRelevantUsers(req);
                }
            })
            .catch((err) => {
                const s = this.dispatch.findSession(req.reqUser);
                if (s) {
                    s.getSocket().emit(CommEvent.REQ_ERR, err);
                }
            });
    }

    private doDelete(req: IWKORequest) {
        this.dao
            .visits(req.reqUser)
            .delete(req.visit._id)
            .then((res) => {
                // TODO server response
                this.notifyRelevantUsers(req);
            })
            .catch((err) => {
                const s = this.dispatch.findSession(req.reqUser);
                if (s) {
                    s.getSocket().emit(CommEvent.REQ_ERR, err);
                }
            });
    }

    private notifyRelevantUsers(data: IWKORequest) {
        this.dao
            .users()
            .findAll()
            .then((payload) => {
                payload.rows
                    .filter((row: any) => {
                        return row.doc.reviewGroup === data.notifyGroup && !row.doc._id.startsWith("_design");
                    })
                    .map((row: any) => {
                        return row.doc._id;
                    })
                    .forEach((username: string) => {
                        const s = this.dispatch.findSession(username);
                        s ? console.log("SOCKET TO NOTIFY FOUND: ", username) : console.log("SOCKET TO NOTIFY NOT FOUND", username);
                        const notification: IWKONotification = {
                            changedBy: data.reqUser,
                            newForm: data.visit,
                            newStatus: data.visit.form.status[data.visit.form.status.length - 1],
                            timestamp: Date.now().toString(),
                        };
                        if (s && username !== data.reqUser) {
                            const sock = s.getSocket();
                            sock.emit(CommEvent.NOTIFICATION, notification);
                        }
                    });
            });
    }
}
