import * as socketIo from "socket.io";
import { WKODbAccess } from "../data/WKODbAccess";
import { CommEvent, IWKOMessage, IWKORequest, IWKONotification, IWKODashboardData } from "./WKOCommunication";
import { WKOSocket } from "./WKOSocket";
import { IVisit, IUser } from "../data/Repository";
import { DashData } from "../data/DashData";
export class ClientSession {
    private socket!: socketIo.Socket;
    private dao!: WKODbAccess;
    private dispatch!: WKOSocket;
    private sessionID!: string;
    private dashData!: DashData;
    // get clientDashboardData() {
    //     return this.dashData;
    // }
    // set clientDashboardData(data: IWKODashboardData) {
    //     this.dashData = data;
    // }
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
          
            const wkoFormUpdate: IWKORequest = data as IWKORequest;
            this.handleRequest(wkoFormUpdate);
        });
        this.socket.on(CommEvent.DASHBOARD_DATA_PASS, (data: IWKODashboardData) => {
         
            if (!this.dashData) {
                this.dashData = new DashData(data.data, data.username, data.userType);
                this.socket.emit(CommEvent.DASHBOARD_DATA_PASS, this.dashData.toIWKODashData());
            } else {
                this.dashData.setData(data.data);
                this.socket.emit(CommEvent.DASHBOARD_DATA_PASS, this.dashData.toIWKODashData());
            }
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
            case "get-dash-data":
           
                this.passDashboardData(data);
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
            .findAll({include_docs: true})
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
                        const notification: IWKONotification = {
                            changedBy: data.reqUser,
                            newForm: data.visit,
                            newStatus: data.visit.form.status[data.visit.form.status.length - 1],
                            timestamp: Date.now().toString(),
                        };
                        // this.dashData.mergeNotification(notification);
                        if (s) {
                            
                            const sock = s.getSocket();
                            sock.emit(CommEvent.NOTIFICATION, notification);
                        }
                    });
            });
    }

    private passDashboardData(data: IWKORequest) {
        
        try {
            if (this.dashData) {
                this.socket.emit(CommEvent.DASHBOARD_DATA_PASS, this.dashData.toIWKODashData());
            } else {
                this.socket.emit(CommEvent.DASHBOARD_DATA_PASS, null);
            }
        } catch(err) {
            this.socket.emit(CommEvent.REQ_ERR, err);
        }

    }
}
