import { Database, IdbConfig } from "./Database";
import { Repository, IVisit, IUser } from "./Repository";
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
}
