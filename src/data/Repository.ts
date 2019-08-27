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

    public findAll(options: any): Promise<any> {
        return this.dbo.allDocs(options);
    }

    public createAll(docs: T[]) {
        return this.dbo.bulkDocs(docs);
    }

    public deleteAll(docs: T[]): Promise<any> {
        return this.dbo.bulkDocs(docs);
    }
    public query(designView: string, options: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbo.query(designView, options, (err, payload)=> {
                if (err) {
                    reject(err)
                }
                if (payload) {
                    resolve(payload);
                }
                else {
                    throw new Error(`Error querying view ${designView} failed`);
                }
            })
        })
        //return this.dbo.query(designView, options);
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
export interface IOsClients {
    _id: string;
    _rev: string;
    clients: any[];
}
export interface IReviewGroup {
    _id: string;
    _rev: string;
    form: any;
    reviewees: any;
    reviewers: any;
}

