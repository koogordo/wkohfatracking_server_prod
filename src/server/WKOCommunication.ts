import { IVisit } from "../data/Repository";
export enum CommEvent {
    MESSAGE = "wko-message",
    REQUEST = "form-request",
    NOTIFICATION = "change-notify",
    REQ_ERR = "request-error",
    DASHBOARD_DATA_PASS = "dashboard-data-pass",
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
    newForm: any;
    changedBy: string;
    timestamp: string;
    newStatus: string;
}

export interface IWKODashboardData {
    data: any;
    userType: string;
    username: string;
}
