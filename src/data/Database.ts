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
        return new PouchDB(`${this.baseAddressInstance()}/families`);
    }

    public userDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.authBaseAddressInstance()}/_users`);
    }

    public archiveDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.baseAddressInstance()}/formarchive`);
    }

    public formDBInstance(): PouchDB.Database {
        return new PouchDB(`${this.baseAddressInstance()}/forms`);
    }

    public osDBInstance(osDbName: string) {
        return new PouchDB(`${this.authBaseAddressInstance()}/${osDbName.toLowerCase()}`);
    }

    private baseAddressInstance(): string {
        return `http://${this.config.domain}/couchdb`;
    }
    private authBaseAddressInstance(): string {
        return `http://${this.config.username}:${this.config.password}@${this.config.domain}/couchdb`;
    }
}
