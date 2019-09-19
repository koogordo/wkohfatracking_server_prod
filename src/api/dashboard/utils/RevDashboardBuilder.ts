import {BehaviorSubject} from "rxjs";

import OsDashboardBuilder from "./OsDashboardBuilder";
import {WKODbAccess} from "../../../data/WKODbAccess";

export default class RevDashboardBuilder {
    private dao: WKODbAccess;
    private username: string;
    private familyIdSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    constructor(dao: WKODbAccess, username: string) {
        this.dao = dao;
        this.username = username;
    }

    getReviewGroup() {
        return this.dao.users().find(this.username).then(user => {
            if (user) {
                return user.reviewGroup
            } else {
                return new Error(`Unable to build dash for user: ${this.username} does not exist.`)
            }
        }).catch(err => err);
    }
    getOsesInRevGroup() {
        return this.getReviewGroup().then(reviewGroup => {
            console.log(reviewGroup)
            if (reviewGroup !== 'ALL') {
                return this.dao.users().query("review_groups/byReviewGroup", { include_docs: true, key: reviewGroup || "R1" }).then(payload => {
                    return this.makeOsesUnique(payload);
                }).catch(err => {
                    return err;
                });
            } else {
                return this.dao.users().findAll({include_docs: true}).then(payload => {
                    return this.makeOsesUnique(payload);
                }).catch(err => {
                    return err;
                })
            }

        }).catch(err => {
            return err;
        });
    }
    makeOsesUnique(osPayload: any) {
        const uniqueOS = [];
        const payloadWithReviewersRemoved = osPayload.rows.filter((row: any) => {
            if (row.doc._id.startsWith('org.couchdb.user')) {
                return row.doc.roles.indexOf("REVIEWER") < 0 && row.doc.roles.indexOf("ADMIN") < 0;
            }
            return false;
        });
        const osUserNameArray = payloadWithReviewersRemoved.map((row: any) => {
            return row.doc.name;
        });
        for (const osName of osUserNameArray) {
            if (uniqueOS.indexOf(osName) < 0) {
                uniqueOS.push(osName);
            }
        }
        return uniqueOS;
    }
    buildOs(os: any) {
        const username = `org.couchdb.user:${os}`;
        const tempOsDash = new OsDashboardBuilder(this.dao, username, os.toLowerCase(), true);

        let needAction: any;
        return tempOsDash.buildDashboard().then(dashFams => {
            const tempOs = {
                OSUsername: os,
                families: null,
                actionRequired: null
            }

            for (const family of dashFams) {
                for (const client of family.child) {
                    if (this.isActionRequiredRev(client)[0]) {
                        needAction = this.isActionRequiredRev(client);
                        break;
                    }
                }
                for (const client of family.adult) {
                    if (this.isActionRequiredRev(client)[0]) {
                        needAction = this.isActionRequiredRev(client);
                        break;
                    }
                }
            }
            tempOs.families = dashFams
            tempOs.actionRequired = needAction;

            return tempOs;
        }).catch(err => err);
    }
    buildDashboard() {
        return this.getOsesInRevGroup().then(reviewGroupOses => {
            const reviewerOsPromises = []
            for (const os of reviewGroupOses) {
           
                reviewerOsPromises.push(this.buildOs(os));
            }
            return Promise.all(reviewerOsPromises).then(reviewerOses => {
               
                return reviewerOses;
            }).catch(err => {
                return err;
            })
        }).catch(err => {
            return err;
        });
    }

    isActionRequiredRev(client: any) {
        let formStatuses: any[] = [];
        client.forms.CompleteForms.map((form:any) => {
            formStatuses.push(form.form.status[form.form.status.length - 1]);
        });
        client.forms.TransitionForms.map((form:any) => {
            formStatuses.push(form.form.status[form.form.status.length - 1]);
        });
        client.forms.ReviewForms.map((form:any) => {
            formStatuses.push(form.form.status[form.form.status.length - 1]);
        });
        return formStatuses.length > 0 ? [true, formStatuses] : [false, null];
    }
}
