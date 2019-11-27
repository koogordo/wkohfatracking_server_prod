import { IVisit } from "../data/Repository";
import {DashData} from "../data/DashData";
export enum CommEvent {
    MESSAGE = "wko-message",
    REQUEST = "form-request",
    NOTIFICATION = "change-notify",
    REQ_ERR = "request-error",
    DASHBOARD_DATA_PASS = "dashboard-data-pass",
    VISIT_STATUS_UPDATE = "visit-status-update",
    REQUEST_TO_EDIT = "request-permission-to-edit-visit",
    PERMISSION_RELEASE = "release-edited-visit-hold",
    BLOCK_EDITING = "block-visit-editing",
    SYNCH = "synch-completed-work"

}

export interface IWKOMessage {
    destination: string;
    body: string;
    timestamp: string;
}

export interface IWKORequest {
    visit: any;
    reqUser: string;
    action?: string;
    notifyGroup?: string;
    doNotify: boolean;
    userDB: string;
}

export interface IWKONotification {
    changedBy: string;
    updateDate: string;
    uts: number;
    updatedClients: any[];
    notifyGroup: any;
}

export interface IWKODashboardData {
    data: any;
    userType: string;
    username: string;
}

export interface IWKOVisitStatusUpdate {
    visitInfo: any;
    visitUpdateInfo: any;
    updatedStatus: any;
    reviewGroup: any;
    changedBy: any;
    readyForSync: boolean;
}

export interface IWKOVisitEditPermission {
    token: string;
    visitID: string;
    permissionGranted?: boolean;
    alreadyInUseBy?: string;
}

export interface IWKOPermissionRelease {
    token: string;
    visitID: string;
}

export interface IWKOSynchTask {
    data: any,
    role: string,
}
