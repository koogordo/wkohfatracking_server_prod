import {WKODbAccess} from "../../../data/WKODbAccess";
import moment from "moment";
import FormUtil from "../../../utils/FormUtil";
export default class AdminDashboardBuilder {
    private dao: WKODbAccess;
    private username: string;
    constructor(dao: WKODbAccess, username: string) {
        this.dao = dao;
        this.username = username
    }

    getOsDbNames() {
        return this.dao.users().findAll({include_docs: true}).then(payload => {
            const osRows = payload.rows.filter((row: any) => {
                return row.doc._id.startsWith("org.couchdb.user") && row.doc.roles.indexOf("OS") >= 0
            })
            const osDbNames = osRows.map((osRow: any) => {
                return osRow.doc._id.split(":")[1].toLowerCase();
            })
            return osDbNames;
        })
    }

    getVisits(){
        return this.getOsDbNames().then(osDbNames => {
            const promises = []
            for (const osDbName of osDbNames) {
               promises.push(this.dao.visits(osDbName).query('index/byVisitStatus',{include_docs: true, key: 'queued'}).then(payload => {
                    return payload.rows.map((row: any) => {return row.doc});
                }).catch(err => {return err}));
            }
            return Promise.all(promises).then((queuedVisitsArr: any[]) => {
                let queuedVisits: any[] = [];
                for (const visitArr of queuedVisitsArr) {
                    const visitsForDisplay = visitArr.map((doc: any) => {
                        let visitDateQ: any;
                        if (FormUtil.isCompressed(doc.form)) {
                            visitDateQ = doc.form.contents.find((question: any) => {
                                return question.key === 'Visit Date';
                            })
                            doc.form.visitDate = moment(visitDateQ.value).format("MMM DD YYYY");
                        } else {
                            const visDateIndex = FormUtil.indexQuestionGroup(doc.form, 'Visit Date');
                            visitDateQ = FormUtil.findFormPartByIndex(doc.form, visDateIndex);
                            doc.form.visitDate = moment(visitDateQ.input).format("MMM DD YYYY");
                        }
                      
                        doc.form.dateSubmitted = moment(doc.form.status[doc.form.status.length - 1].date).format("MMM DD YYYY");
                        return doc;
                    })
                    queuedVisits = queuedVisits.concat(visitsForDisplay);
                }
                return queuedVisits
            })
        })
    }

    public buildDashboard() {
        return this.getVisits().then(queuedVisits => {
     
            return queuedVisits;
        })
    }
}
