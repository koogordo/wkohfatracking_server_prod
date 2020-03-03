import { WKODbAccess } from '../../../data/WKODbAccess';
import { BehaviorSubject } from 'rxjs';
import { IForm, IOsClients, IVisit } from '../../../data/Repository';
const pouchCollate = require('pouchdb-collate');
import moment from 'moment';
import OsViewVisitBuilder from '../../visit/utils/OsViewVisitBuilder';
import { DashBoardData } from '../models/DashBoardData';
export default class OsDashboardBuilder {
    private dao: WKODbAccess;
    private username: string;
    private userDBName: string;
    private familyIdSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
        null
    );
    private buildingForReviewer: boolean;
    constructor(
        dao: WKODbAccess,
        username: string,
        userDBName: string,
        buildingForReviewer: boolean
    ) {
        this.dao = dao;
        this.userDBName = userDBName;
        this.username = username;
        this.buildingForReviewer = buildingForReviewer;
    }

    getOsFamilyIDs() {
        return this.dao
            .osClients(this.userDBName)
            .find('clients')
            .then(osClientsDoc => {
                this.familyIdSubject.next(osClientsDoc);
                return osClientsDoc;
            })
            .catch(err => {
                throw err;
            });
    }

    getOsFamilies() {
        // return this.getOsFamilyIDs()
        //     .then((osClientsDoc: IOsClients) => {
        //         return Promise.all(
        //             osClientsDoc.clients.map(id => {
        //                 return this.dao
        //                     .families()
        //                     .find(id.familyID)
        //                     .then(fam => {
        //                         return fam;
        //                     })
        //                     .catch(err => {
        //                         throw err;
        //                     });
        //             })
        //         )
        //             .then(families => {
        //                 return families;
        //             })
        //             .catch(err => {
        //                 throw err;
        //             });
        //     })
        //     .catch(err => {
        //         throw err;
        //     });
        return this.dao
            .families()
            .query('usersViews/assignedOs', {
                include_docs: true,
                key: this.userDBName,
            })
            .then(payload => {
                return payload.rows.map((row: any) => {
                    return row.doc;
                });
            })
            .catch(err => {
                console.log(err);
            });
    }
    getClientForms(clientID: any) {
        clientID = clientID.slice(0, clientID.length - 3);
        return this.dao
            .visits(this.userDBName)
            .findAll({
                include_docs: true,
                startkey: clientID + '\uffff',
                endkey: clientID,
                descending: true,
            })
            .then(res => {
                const forms = res.rows.map((row: any) => {
                    return row.doc;
                });
                if (this.buildingForReviewer) {
                    return this.sortFormsForReviewer(forms);
                } else {
                    return this.sortFormsForOS(forms);
                }
            })
            .catch(err => {
                return err;
            });
    }
    getClientPreviousForms(clientID: any) {
        return this.dao
            .forms()
            .findAll({ include_docs: true })
            .then(allForms => {
                const forms = allForms.rows
                    .filter((row: any) => {
                        if (!row || row.id.startsWith('_design')) {
                            return false;
                        }
                        return true;
                    })
                    .map((row: any) => {
                        return row.doc;
                    });
                const prevVisitPromises: any = [];

                forms.forEach((form: any) => {
                    let viewVisitBuilder;
                    if (form && form._id) {
                        viewVisitBuilder = new OsViewVisitBuilder(
                            this.dao,
                            this.userDBName,
                            form._id,
                            clientID
                        );
                    } else {
                        throw new Error('Not a valid form, no id present.');
                    }
                    prevVisitPromises.push(
                        Promise.all([
                            viewVisitBuilder.combineOsVisitsOfCurrentType(),
                            viewVisitBuilder.uncompressedPrevVisitFromArchive(),
                        ]).then(([activeVisits, archivedVisit]) => {
                            if (activeVisits && activeVisits.length > 0) {
                                return activeVisits[0];
                            } else if (archivedVisit) {
                                return archivedVisit;
                            }
                            return null;
                        })
                    );
                    viewVisitBuilder = null;
                });

                return Promise.all(prevVisitPromises).then(prevVisits => {
                    return prevVisits;
                });
            });
    }
    buildChild(child: any, famId: string, childNum: any) {
        return Promise.all([this.getClientForms(child.clientID)]).then(
            ([forms]) => {
                const tempChild = {
                    clientFName: child.clientFName,
                    clientLName: child.clientLName,
                    clientType: 'child',
                    terminated:
                        child.terminated !== undefined
                            ? child.terminated
                            : false,
                    clientID:
                        child.clientID ||
                        encodeURI(
                            pouchCollate.toIndexableString([
                                famId,
                                'child',
                                childNum,
                            ])
                        ),
                    forms: forms,
                    previousVisits: child.previousVisits,
                };

                // const previousVisits: any = {};
                // prevVisitsByType.forEach((visit: any) => {
                //     previousVisits[visit.form.name] = visit;
                // })
                // tempChild.previousVisits = previousVisits;
                // console.log('Child', tempChild)
                return tempChild;
            }
        );
    }
    buildAdult(adult: any, famId: string, adultNum: any) {
        return Promise.all([this.getClientForms(adult.clientID)]).then(
            ([forms]) => {
                const tempAdult = {
                    clientFName: adult.clientFName,
                    clientLName: adult.clientLName,
                    clientType: 'adult',
                    terminated:
                        adult.terminated !== undefined
                            ? adult.terminated
                            : false,
                    clientID:
                        adult.clientID ||
                        encodeURI(
                            pouchCollate.toIndexableString([
                                famId,
                                'adult',
                                adultNum,
                            ])
                        ),
                    forms: forms,
                    previousVisits: adult.previousVisits,
                };

                return tempAdult;
            }
        );
    }
    buildFamily(family: any) {
        const adultPromises = [];
        const childPromises = [];
        for (const adult in family.adult) {
            adultPromises.push(
                this.buildAdult(family.adult[adult], family._id, adult)
            );
        }
        for (const child in family.child) {
            childPromises.push(
                this.buildChild(family.child[child], family._id, child)
            );
        }
        const tempDashFamily: any = {
            familyID: family._id,
            adult: [],
            child: [],
            clientFName: family.primaryFName
                ? family.primaryFName
                : family.adult[0].clientFName,
            clientLName: family.primaryLName
                ? family.primaryLName
                : family.adult[0].clientLName,
        };
        const allClients = adultPromises.concat(childPromises);
        return Promise.all(allClients)
            .then(clients => {
                for (const client of clients) {
                    if (client.clientType === 'adult') {
                        tempDashFamily.adult.push(client);
                    } else {
                        tempDashFamily.child.push(client);
                    }
                }
                return tempDashFamily;
            })
            .catch(err => {
                return err;
            });
    }
    public buildDashboard() {
        if (this.buildingForReviewer) {
            return this.getOsFamilies().then(families => {
                const familyBuilds = families.map((family: any) => {
                    return this.buildFamily(family);
                });
                return Promise.all(familyBuilds)
                    .then(osFamilies => {
                        return osFamilies;
                    })
                    .catch(err => {
                        return err;
                    });
            });
        } else {
            const dashRes: DashBoardData = {
                _id: '',
                name: '',
                roles: [],
                created: '',
                updated: '',
                forms: [],
                hash: '',
                homePageData: [],
                user: null,
                visitsCreatedOffline: [],
                updatedFamilies: [],
                families: [],
            };
            const dashComponentPromises: any[] = [];
            dashComponentPromises.push(this.dao.users().find(this.username));
            dashComponentPromises.push(this.getOsFamilies());
            dashComponentPromises.push(
                this.dao
                    .forms()
                    .findAll({ include_docs: true })
                    .then(res => {
                        return res.rows
                            .filter((row: any) => {
                                return row.doc._id.startsWith('54blankForm');
                            })
                            .map((row: any) => {
                                return row.doc;
                            });
                    })
                    .catch(err => {
                        console.log(err);
                    })
            );
            return Promise.all(dashComponentPromises)
                .then(([user, families, forms]) => {
                    dashRes.user = user;
                    dashRes.hash = user.apipassword;
                    dashRes.roles = user.roles;
                    dashRes.families = families;
                    dashRes.forms = forms;
                    dashRes.created = moment().format();
                    dashRes.updated = moment().format();
                    dashRes._id = user._id;
                    dashRes.name = user.name;
                    const familyBuilds = families.map((family: any) => {
                        return this.buildFamily(family);
                    });
                    return Promise.all(familyBuilds)
                        .then(osFamilies => {
                            dashRes.homePageData = osFamilies;
                            return dashRes;
                        })
                        .catch(err => {
                            return err;
                        });
                })
                .catch(err => {
                    throw err;
                });
        }
    }

    sortFormsForOS(forms: any) {
        const statuses: any = {
            open: 0,
            'action required': 1,
            permanent: 4,
            queued: 3,
            'reviewer pool': 2,
            'under review': 2,
            submitted: 2,
        };
        const actForms = forms.filter((form: any) => {
            return (
                statuses[
                    form.form.status[form.form.status.length - 1]['value']
                ] === 0
            );
        });
        const transForms = forms.filter((form: any) => {
            return (
                statuses[
                    form.form.status[form.form.status.length - 1]['value']
                ] === 1
            );
        });
        const lockedForms = forms.filter((form: any) => {
            return (
                statuses[
                    form.form.status[form.form.status.length - 1]['value']
                ] === 2
            );
        });

        return {
            ActiveForms: actForms,
            TransitionForms: transForms,
            LockedForms: lockedForms,
        };
    }
    sortFormsForReviewer(forms: any) {
        const statuses: any = {
            open: 0,
            'action required': 1,
            permanent: 3,
            queued: 3,
            'reviewer pool': 2,
            'under review': 2,
            submitted: 2,
        };
        const transForms = forms.filter((form: any) => {
            return (
                statuses[
                    form.form.status[form.form.status.length - 1]['value']
                ] === 1
            );
        });
        const revForms = forms.filter((form: any) => {
            return (
                statuses[
                    form.form.status[form.form.status.length - 1]['value']
                ] === 2
            );
        });
        const completeForms = forms.filter((form: any) => {
            return (
                statuses[
                    form.form.status[form.form.status.length - 1]['value']
                ] === 3 &&
                form.form.status[form.form.status.length - 1]['value'] !==
                    'permanent'
            );
        });
        return {
            TransitionForms: transForms,
            ReviewForms: revForms,
            CompleteForms: completeForms,
        };
    }
    // sortFormsForDisplay(forms) {
    //     forms.ActiveForms.forEach((formDoc) => {
    //         if (this._fg.isCompressed(formDoc.form)) {
    //             formDoc.form = this._fg.expand(this.allFormsMap.get(formDoc.form.name), formDoc.form);
    //         }
    //     });
    //     forms.LockedForms.forEach((formDoc) => {
    //         if (this._fg.isCompressed(formDoc.form)) {
    //             formDoc.form = this._fg.expand(this.allFormsMap.get(formDoc.form.name), formDoc.form);
    //         }
    //     });
    //     forms.TransitionForms.forEach((formDoc) => {
    //         if (this._fg.isCompressed(formDoc.form)) {
    //             formDoc.form = this._fg.expand(this.allFormsMap.get(formDoc.form.name), formDoc.form);
    //         }
    //     });
    //     forms.ActiveForms.sort((a, b) => {
    //         const aDate = this._fg.findFormPartByIndex(a.form, this._fg.indexQuestionGroup(a.form, "Visit Date")).input;
    //         const bDate = this._fg.findFormPartByIndex(b.form, this._fg.indexQuestionGroup(b.form, "Visit Date")).input;
    //         a = moment(aDate);
    //         b = moment(bDate);
    //         if (a.isAfter(b)) {
    //             return -1;
    //         } else if (b.isAfter(a)) {
    //             return 1;
    //         } else {
    //             return 0;
    //         }
    //     });
    //     forms.LockedForms.sort((a, b) => {
    //         const aDate = this._fg.findFormPartByIndex(a.form, this._fg.indexQuestionGroup(a.form, "Visit Date")).input;
    //         const bDate = this._fg.findFormPartByIndex(b.form, this._fg.indexQuestionGroup(b.form, "Visit Date")).input;
    //         a = moment(aDate);
    //         b = moment(bDate);
    //         if (a.isAfter(b)) {
    //             return -1;
    //         } else if (b.isAfter(a)) {
    //             return 1;
    //         } else {
    //             return 0;
    //         }
    //     });
    //     forms.TransitionForms.sort((a, b) => {
    //         const aDate = this._fg.findFormPartByIndex(a.form, this._fg.indexQuestionGroup(a.form, "Visit Date")).input;
    //         const bDate = this._fg.findFormPartByIndex(b.form, this._fg.indexQuestionGroup(b.form, "Visit Date")).input;
    //         a = moment(aDate);
    //         b = moment(bDate);
    //         if (a.isAfter(b)) {
    //             return -1;
    //         } else if (b.isAfter(a)) {
    //             return 1;
    //         } else {
    //             return 0;
    //         }
    //     });
    // }
}
