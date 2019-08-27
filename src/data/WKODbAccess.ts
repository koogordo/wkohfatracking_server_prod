import { Database, IdbConfig } from "./Database";
import {Repository, IVisit, IUser, IOsClients, IReviewGroup} from "./Repository";
export class WKODbAccess {
    private dbo: Database;
    constructor(config: IdbConfig) {
        this.dbo = new Database(config);
    }

    public visits(osname: string) {
        return new Repository<IVisit>(this.dbo.osDBInstance(osname));
    }

    public users() {
        return new Repository<IUser>(this.dbo.userDBInstance());
    }

    public families() {
        return new Repository<any>(this.dbo.familyDBInstance());
    }
    public osClients(osname: string) {
        return new Repository<IOsClients>(this.dbo.osDBInstance(osname));
    }
    public reviewGroups() {
        return new Repository<IReviewGroup>(this.dbo.reviewGroupDBInstance());
    }

}
