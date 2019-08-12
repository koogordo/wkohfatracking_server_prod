import PouchDB from "pouchdb";
export class Repository<T> {
    protected dbo!: PouchDB.Database;
    constructor(dbo: PouchDB.Database) {
        this.dbo = dbo;
    }

    public create(doc: T): Promise<any> {
        return this.dbo.put(doc);
    }
    public update(doc: T) {
        console.log(doc);
        return this.dbo.put(doc);
    }
    public find(id: any): Promise<T> {
        return this.dbo.get(id);
    }

    public delete(id: any) {
        return this.dbo.get(id).then((doc) => {
            return this.dbo.remove(doc);
        });
    }

    public findAll(): Promise<any> {
        return this.dbo.allDocs({ include_docs: true });
    }

    public createAll(docs: T[]) {
        return this.dbo.bulkDocs(docs);
    }

    public deleteAll(docs: T[]): Promise<any> {
        return this.dbo.bulkDocs(docs);
    }
}

//models
export interface IVisit {
    _id?: string;
    _rev?: string;
    _deleted?: boolean;
    form: any;
}

export interface IUser {
    _id?: string;
    _rev?: string;
    email: string;
    firstName: string;
    form: any;
    lastName: string;
    name: string;
    reviewGroup: string;
    roles: string[];
    type: string;
}
