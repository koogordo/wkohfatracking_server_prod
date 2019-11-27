export interface DashBoardData {
    _id: string;
    _rev?: string;
    name: string;
    roles: string[];
    created: string;
    updated: string;
    forms: any[];
    hash: string;
    homePageData: any[];
    user: any;
    visitsCreatedOffline: any[];
    updatedFamilies: any[];
    families: any[];
}
