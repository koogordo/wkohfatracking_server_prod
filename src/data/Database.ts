import PouchDB from "pouchdb";
export interface IdbConfig {
    username: string;
    password: string;
    domain: string;
}
export class Database {
    private config: IdbConfig;
    constructor(config: IdbConfig) {
        this.config = config;
    }

    public familyDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.config.domain}/families`);
    }

    public userDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.config.domain}/_users`);
    }

    public archiveDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.config.domain}/formarchive`);
    }

    public formDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.config.domain}/forms`);
    }
    public reviewGroupDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.config.domain}/reviewgroups`);
    }
    public osDBInstance(osDbName: string) {
        return new PouchDB(`${this.config.domain}/${osDbName.toLowerCase()}`);
    }

    private baseAddressInstance(): string {
        return `https://${this.config.domain}/couchdb`;
    }
    private authBaseAddressInstance(): string {
        return `https://${this.config.username}:${this.config.password}@${this.config.domain}/couchdb`;
    }
}
