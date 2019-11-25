import * as socketIo from "socket.io";
import { WKODbAccess } from "../data/WKODbAccess";
import {jwtSecret} from "../config";
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import moment from 'moment'
import {
    CommEvent,
    IWKOMessage,
    IWKORequest,
    IWKONotification,
    IWKODashboardData,
    IWKOVisitStatusUpdate, IWKOVisitEditPermission, IWKOPermissionRelease, IWKOSynchTask
} from "./WKOCommunication";
import { WKOSocket } from "./WKOSocket";
import { IVisit, IUser } from "../data/Repository";
import { DashData } from "../data/DashData";
import RevDashboardBuilder from "../api/dashboard/utils/RevDashboardBuilder";
import OsDashboardBuilder from "../api/dashboard/utils/OsDashboardBuilder";
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
        // this.socket.on(CommEvent.REQUEST, (data: any) => {
        //
        //     const wkoFormUpdate: IWKORequest = data as IWKORequest;
        //     this.handleRequest(wkoFormUpdate);
        // });
        // this.socket.on(CommEvent.DASHBOARD_DATA_PASS, (data: IWKODashboardData) => {
        //
        //     if (!this.dashData) {
        //         this.dashData = new DashData(data.data, data.username, data.userType);
        //         this.socket.emit(CommEvent.DASHBOARD_DATA_PASS, this.dashData.toIWKODashData());
        //     } else {
        //         this.dashData.setData(data.data);
        //         this.socket.emit(CommEvent.DASHBOARD_DATA_PASS, this.dashData.toIWKODashData());
        //     }
        // });

        this.socket.on(CommEvent.NOTIFICATION, (notification: IWKONotification) => {
            // TODO handle the update notification
            this.notifyRelevantUsers(notification);
        })
        this.socket.on(CommEvent.VISIT_STATUS_UPDATE, (notification: IWKOVisitStatusUpdate) => {
            this.notifyRelevantUsersOfVisitStatusUpdate(notification);
        });
        this.socket.on(CommEvent.REQUEST_TO_EDIT, (request: IWKOVisitEditPermission) => {
            this.handleRequestToEdit(request);
        })
        this.socket.on(CommEvent.PERMISSION_RELEASE, (request: IWKOPermissionRelease) => {
            this.handleEditPermissionRelease(request);
        })
        this.socket.on(CommEvent.SYNCH, (request) => {
            this.handleSynch(request);
        })
    }

    private handleMessage(data: IWKOMessage): void {
        // TODO do something with the request data
        const s = this.dispatch.findSession(data.destination);
        if (s) {
            s.getSocket().emit(CommEvent.MESSAGE, data.body);
        }
    }

    // private handleRequest(data: IWKORequest): void {
    //     // TODO do something with the form update;
    //     switch (data.action) {
    //         case "update":
    //             this.doUpdate(data);
    //             break;
    //         case "save":
    //             this.doDelete(data);
    //             break;
    //         case "notify":
    //             this.notifyRelevantUsers(data);
    //             break;
    //         case "get-dash-data":
    //
    //             this.passDashboardData(data);
    //         default: {
    //             break;
    //         }
    //     }
    // }
    // private doUpdate(req: IWKORequest) {
    //     this.dao
    //         .visits(req.userDB)
    //         .update(req.visit)
    //         .then((res) => {
    //             // TODO server response
    //             if (req.doNotify) {
    //                 this.notifyRelevantUsers(req);
    //             }
    //         })
    //         .catch((err) => {
    //             const s = this.dispatch.findSession(req.reqUser);
    //
    //             if (s) {
    //                 s.getSocket().emit(CommEvent.REQ_ERR, err);
    //             }
    //         });
    // }

    // private doDelete(req: IWKORequest) {
    //     this.dao
    //         .visits(req.reqUser)
    //         .delete(req.visit._id)
    //         .then((res) => {
    //             // TODO server response
    //             this.notifyRelevantUsers(req);
    //         })
    //         .catch((err) => {
    //             const s = this.dispatch.findSession(req.reqUser);
    //             if (s) {
    //                 s.getSocket().emit(CommEvent.REQ_ERR, err);
    //             }
    //         });
    // }

    private notifyRelevantUsers(notification: IWKONotification) {
        this.dao
            .users()
            .findAll({include_docs: true})
            .then((payload) => {
                let notifyUsers;
                if (notification.notifyGroup === 'ALL') {
                    notifyUsers = payload.rows.map((row: any) => {
                        return row.doc.name
                    }).filter((name: any) => {
                        return name !== notification.changedBy
                    });
                } else {
                    notifyUsers = payload.rows
                        .filter((row: any) => {
                            return (row.doc.reviewGroup === notification.notifyGroup || row.doc.reviewGroup === 'ALL') &&
                                !row.doc._id.startsWith("_design") &&
                                row.doc.name !==  notification.changedBy
                        })
                        .map((row: any) => {
                            return row.doc.name;
                        });
                }

                    notifyUsers.forEach((username: string) => {
                        const s = this.dispatch.findSession(`org.couchdb.user:${username}`);
                        if (s) {
                            const sock = s.getSocket();
                            sock.emit(CommEvent.NOTIFICATION, notification);
                        }
                    });
            });
    }

    private notifyRelevantUsersOfVisitStatusUpdate(notification: IWKOVisitStatusUpdate) {
        this.dao
            .users()
            .findAll({include_docs: true})
            .then((payload) => {
                let notifyUsers;
                notifyUsers = payload.rows.filter((row: any) => {
                    if (row.doc._id.startsWith('_design')) {
                        return false;
                    } else {
                        return (row.doc.roles.indexOf('REVIEWER') >= 0 &&
                            (row.doc.reviewGroup === notification.reviewGroup || notification.reviewGroup === 'ALL' || row.doc.reviewGroup === 'ALL') &&
                                row.doc.name !== notification.changedBy) ||
                               (row.doc.roles.indexOf('OS') >= 0 &&
                                row.doc.name === notification.visitInfo.os &&
                                row.doc.name !== notification.changedBy)
                    }
                }).map((row: any) => {
                        return row.doc;
                });

                const userUpdatePromises: any[] = [];
                notifyUsers.forEach((user: any) => {
                    const s = this.dispatch.findSession(`org.couchdb.user:${user.name}`);
                    if (s) {
                        const sock = s.getSocket();
                        sock.emit(CommEvent.VISIT_STATUS_UPDATE, notification);
                    } else {
                        console.log("User offline: ", user.name);
                        if (!user.visitChanges) {
                            user.visitChanges = [notification]
                        } else {
                            const existsAtIndex = user.visitChanges.findIndex((visitChange: any) => {return visitChange.visitInfo.visitFormID === notification.visitInfo.visitFormID});
                            if (existsAtIndex > -1) {
                                user.visitChanges[existsAtIndex] = notification;
                            } else {
                                user.visitChanges.push(notification);
                            }
                        }
                        userUpdatePromises.push(this.dao.users().update(user).then(res => {return res}).catch(err => err));
                        Promise.all(userUpdatePromises);
                        // .then(userUpdateReses => {
                        //     userUpdateReses.forEach(updateRes => {
                        //         if (!updateRes.ok) {
                        //
                        //         }
                        //     })
                        // });
                    }
                });
            });
    }

    private handleRequestToEdit(request: IWKOVisitEditPermission) {
        const requestDetails = this.verifyToken(request.token);
        if (requestDetails.ok) {
            const exisitingPermisson = this.dispatch.visitEditPermisionsList().find((permission) => {
                return permission.token !== request.token && permission.visitID === request.visitID;
            });


            if (exisitingPermisson === undefined) {
                request.permissionGranted = true;
                this.dispatch.registerPermission(request);
                this.dao.users().findAll({include_docs: true}).then(allDocsPayload => {
                    const notifyUsers = allDocsPayload.rows.map((row: any) => {
                        return row.doc.name;
                    }).filter((name: string) => {
                        return name !== requestDetails.payload.username
                    });
                    this.socket.emit(CommEvent.REQUEST_TO_EDIT, request);
                    notifyUsers.forEach((name: string) => {
                        const s = this.dispatch.findSession(`org.couchdb.user:${name}`);
                        if (s) {
                            const sock = s.getSocket();
                            sock.emit(CommEvent.BLOCK_EDITING);
                        }
                    });
                })
            } else {
                request.permissionGranted = false;
                const existingPermissionPayload = this.verifyToken(exisitingPermisson.token);
                request.alreadyInUseBy = existingPermissionPayload.payload.username;
                this.socket.emit(CommEvent.REQUEST_TO_EDIT, request);
            }
        } else {
            request.permissionGranted = false;
            this.socket.emit(CommEvent.REQUEST_TO_EDIT, request);
        }
    }

    handleSynch(request: any) {
        console.log(request);
        this.runSyncProcess(request);
    }

    private handleEditPermissionRelease(request: IWKOPermissionRelease) {
        this.dispatch.unregisterPermission(request);
    }

    private verifyToken(token: string): {ok: boolean, payload: any} {
        let payload;
        try {
            payload = jwt.verify(token, jwtSecret);
            return {ok: true, payload};
        } catch(e) {
            return {ok: false, payload: null};
        }
    }
    private putDashDeletesOnline(request: IWKOSynchTask) {
        // return this.offlineStore.get(this.user.getID()).then((offlineDash: OfflineDashboard) => {
        const deletePromises: any[] = [];
        request.data.visitsCreatedOffline.forEach((visitUpdateInfo: any, i: number) => {
            if (visitUpdateInfo.deleted && request.role === "OS") {
                deletePromises.push(this.dao.visits(request.data._id.split(":")[1]).delete(visitUpdateInfo.visitID).then(removeRes => {
                    return removeRes;
                }).catch(err => {
                    return err;
                }));
            }
        });

        return Promise.all(deletePromises).then((deletedResults) => {
            return deletedResults;
        }).catch(err => console.log(err));
    }

    private putDashUpdatesOnline(request: IWKOSynchTask) {
        // return this.offlineStore.get(this.user.getID()).then((offlineDash: OfflineDashboard) => {
        const updatedVisits: any[] = [];
        request.data.visitsCreatedOffline.forEach((visitUpdate: any) => {
            if(!visitUpdate.deleted) {
                if (request.role === 'OS') {
                    updatedVisits.push(this.putOsUpdates(request.data, visitUpdate));
                } else if (request.role === 'REVIEWER') {
                    updatedVisits.push(this.putReviewerUpdates(request.data, visitUpdate));
                }
            }
        });

        if (request.role === 'OS') {
            return this.dao.visits(request.data._id.split(":")[1]).createAll(updatedVisits).then((visitBulkUpdateRes: any) => {
                return visitBulkUpdateRes;
            }).catch((err: any) => console.log(err));
        } else {
            return Promise.all(updatedVisits).then(updateReses => {
                return updateReses;
            }).catch(err => { console.log(err); });
        }
    }

    private  putOsUpdates(offlineDash: any, visitUpdate: any) {
        const family = offlineDash.homePageData.find((dashFamily: any) => {
            return dashFamily.familyID === visitUpdate.family;
        });
        const updatedVisit = family[visitUpdate.clientType][visitUpdate.clientNumber].forms[visitUpdate.newVisitTransitionGroup].find((visit: any) => {
            return visit._id === visitUpdate.visitID;
        });
        return updatedVisit;
    }

    private putReviewerUpdates(offlineDash: any, visitUpdate: any) {
        const os = offlineDash.homePageData.find((reviewerOs: any) => {
            return reviewerOs.OSUsername === visitUpdate.os;
        });
        const family = os.families.find((dashFamily: any) => {
            return dashFamily.familyID === visitUpdate.family;
        });
        const updatedVisit = family[visitUpdate.clientType][visitUpdate.clientNumber].forms[visitUpdate.newVisitTransitionGroup].find((visit: any) => {
            return visit._id === visitUpdate.visitID;
        });

        return this.dao.visits(visitUpdate.os).update(updatedVisit).then(res => { return res; }).catch(err => { return err; });
    }

    private runSyncProcess(request: any) {
        return this.putDashDeletesOnline(request).then((deleteRes: any) => {
            let deleteOk = false;
            if (deleteRes.length === 0) {
                deleteOk = true;
            } else {
                deleteRes.forEach((res: any) => {
                    if (res.ok) {
                        deleteOk = true;
                    } else {
                        deleteOk = false;
                    }
                });
            }
            if (deleteOk) {
                return this.putDashUpdatesOnline(request).then((updateRes: any) => {
                    let updateOk = false;
                    if (updateRes.length === 0) {
                        updateOk = true;
                    } else {
                        updateRes.forEach((res: any) => {
                            if (res.ok) {
                                updateOk = true;
                            } else {
                                updateOk = false;
                            }
                        });
                    }
                    if (updateOk) {
                        return this.updateOfflineDashData(request).then(updatedData => {
                           this.socket.emit(CommEvent.SYNCH, {data: updatedData, role: request.role} as IWKOSynchTask);
                        }).catch((err: any) => console.log(err));
                    } else {
                        // TODO update error
                        console.log("THERE WAS AN UPDATE ERROR: ", updateRes);
                    }

                }).catch(err => { console.log(err); });
            } else {
                // TODO Delete error
            }
        }).catch(err => { console.log(err); });
    }

    updateOfflineDashData(request: any) {
        const promises = []
        promises.push(
            this.dao.forms().findAll({include_docs: true}).then((allDocsPayload: any) => {
                return allDocsPayload.rows.map((row: any) => {
                    return row.doc;
                });
            })
        );
        promises.push(
            this.dao.users().find(request.data._id).then((doc: any) => {
                return doc;
            }).catch(err =>  {throw err;})
        );
        if (request.roles === 'OS') {
            // promises.push(this.getAllOsClients().catch(err => {throw err;}));
            promises.push(this.buildOsHomePageData(request));
        } else if (request.roles === 'REVIEWER') {
            // promises.push(this.getAllRevClients().catch(err => {throw err;}));
            promises.push(this.buildReviewerHomePageData(request));
        }

        return Promise.all(promises).then(([forms, user, osClients, homepageData]) => {
            request.data.forms = forms;
            request.data.hash = user.apipassword;
            request.data.user = user;
            request.data.homePageData = homepageData;
            request.data.clients = osClients;
            request.data.updated = moment().format();
            return request.data;
        }).catch(err => {throw err; });
    }

    buildReviewerHomePageData(request: any) {
        const revDashBuilder = new RevDashboardBuilder(this.dao, request.data._id);
        return revDashBuilder.buildDashboard().then(reviewerOses => {
            return reviewerOses;
        })
    }

    buildOsHomePageData(request: any) {
        const osDashBuilder = new OsDashboardBuilder(this.dao, request.data._id, request.data_id.split(":")[1], false);
        return osDashBuilder.buildDashboard().then(clients => {
            return clients
        });
    }

}
