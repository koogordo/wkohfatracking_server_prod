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
                    reject(new Error(`Error querying view ${designView} failed`));
                }
            })
        })
        //return this.dbo.query(designView, options);
    }
}

//utils
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
    wkoid: number;
    phone: string;
    name: string;
    reviewGroup: string;
    roles: string[];
    type: string;
    apipassword: string;
    visitChanges?: any[];
}
export interface IOsClients {
    _id: string;
    _rev?: string;
    clients: any[];
}
export interface IReviewGroup {
    _id: string;
    _rev: string;
    form: any;
    reviewees: any;
    reviewers: any;
}
export interface IBlankForm {
    _id?: string;
    _rev: string;
    form: any;
}

export interface IForm {
    allowedClientTypes?: any[];
    client?: string;
    os?: string;
    tabs: ITab[];
    status?: any[];
    formID?: string;
    formRev?: string;
    description?: string;
    name?: string;
}
export interface ITab {
    name?: string;
    description?: string
    sections: ISection[]
}
export interface ISection {
    name?: string;
    description?: string
    rows: IRow[]
}
export interface IRow {
    columnGap?: string;
    columns: IColumn[]
}
export interface IColumn {
    align?: string,
    offset?: string,
    width?: string,
    questions: IQuestion[],
}
export interface IOption {
    key?: string;
    value?:string;
    specify?: boolean;
    rows: IRow[]
}
export interface IQuestion {
    key?: string;
    label?: string;
    labelPosition?: string;
    labelWidth?: string;
    type?: string;
    description?: string;
    required?: boolean;
    notes?: any[];
    validators?: any[];
    usePreviousValue?: boolean;
    input?: any;
    default?: any;
    specifyPosition?: string;
    placeholder?: any;
    hint?: any;
    options?: IOption[];
    orientation?: string;
    offset?: string;
    changed?: boolean;
    maxDate?: string;
    minDate?: string;
    defaultToday?: boolean;
    dropdownWidth?: string;
    function?: string;
    indices?: any;
    maxValue?: any;
    minValue?: any;
    rows?: IRow[];
    addButtonsText?: string;
    removable?: boolean;
    inorout?: any;
    min?: any;
    max?: any;
    step?: any;
}
