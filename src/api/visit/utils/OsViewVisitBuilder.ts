import {WKODbAccess} from "../../../data/WKODbAccess";
import {IBlankForm, IUser, IVisit} from "../../../data/Repository";
import FormUtil from "../../../utils/FormUtil";

export default class OsViewVisitBuilder {
    private dao: WKODbAccess;
    private formID: string;
    private userDBName: string;
    private clientID: string;
    constructor(dao: WKODbAccess, userDBName: string, formID: string, clientID: string) {
        this.dao = dao;
        this.userDBName = userDBName;
        this.formID = formID;
        this.clientID = clientID;
    }

    getNewVisitPrevVisitPair() {
        return Promise.all([this.combineOsVisitsOfCurrentType(), this.currentVisitTemplate(), this.uncompressedPrevVisitFromArchive()]).then(([osVisits, visitTemplate, archivedPrevVisit]) => {
            const result: any = {};
            result.success = true;
            result.visit = visitTemplate;
            result.templateForm = visitTemplate;
            if ( osVisits.length > 0) {
                result.prevVisit = osVisits[0]
            } else if (archivedPrevVisit){
                result.prevVisit = archivedPrevVisit;
            } else {
                result.prevVisit = null;
            }
            return result;
        }).catch(err => {
            throw err;
        })
        // return this.dao.forms().find(this.formID).then((blankForm: IBlankForm) => {
        //     return this.dao.visits(this.userDBName).findAll({include_docs: true}).then(payload => {
        //         const visitRecords: any[] = (payload.rows as Array<any>).filter((row: any) => {
        //             if (!row.doc._id.startsWith('_design') && !row.doc._id.startsWith('clients')) {
        //                 return (
        //                     (row.doc.form.name === blankForm.form.name) &&
        //                     (row.doc._id !== blankForm._id) &&
        //                     (row.doc.form.client === this.clientID) &&
        //                     (row.doc.form.status[row.doc.form.status.length - 1].value !== 'open')
        //                 );
        //             }
        //             return false;
        //         }).map((row: any) => {
        //             return row.doc
        //         });
        //         const orderedForms = FormUtil.orderFormsByDate(visitRecords);
        //         let prevVisit;
        //         if (orderedForms.length > 0) {
        //             prevVisit = orderedForms[0];
        //         } else {
        //             prevVisit = null
        //         }
        //         const templateForm = JSON.parse(JSON.stringify(blankForm))
        //         const result: any = {
        //             success: true,
        //             visit: blankForm,
        //             prevVisit: prevVisit,
        //             templateForm: templateForm
        //         }
        //         return result;
        //     });
        // }).catch(err => {throw err});
    }
    getVisitViewData() {
        if (this.formID.startsWith('54blankForm')) {
           return this.getNewVisitPrevVisitPair().then(visitPair => {
               if(visitPair.prevVisit && FormUtil.isCompressed(visitPair.prevVisit)) {
                   visitPair.prevVisit = FormUtil.expand(visitPair.templateForm, visitPair.prevVisit);
               }
                // const compressedBlankForm = FormUtil.compress(visitPair.newVisit.form);
               //                 // visitPair.newVisit.form = compressedBlankForm;
               //                 // FormUtil.mergePreviousVisitIntoNew(visitPair.newVisit, visitPair.prevVisit)
               // const visit = FormUtil.expand(visitPair.templateForm, visitPair.newVisit)
                return visitPair;
            })
        } else {
            return this.dao.visits(this.userDBName).find(this.formID).then((currentVisit: IVisit) => {
                    return this.getFormTemplate(currentVisit.form.name).then((templateDoc: IBlankForm) => {
                        let visit;
                      
                        if (FormUtil.isCompressed(currentVisit)) {
                            visit = FormUtil.expand(templateDoc, currentVisit);
                        } else {
                            visit = currentVisit
                        }
                        return {success: true, visit}
                    });

            }).catch(err => {throw err});
        }
    }
    makeDisplayVisit() {
        return this.getVisitViewData().then(visit => {
            return visit;
        }).catch(err => err)
    }
    getFormTemplate(formName: string) {
        return this.dao.forms().findAll({include_docs:true}).then(payload => {
            const blankFormDocs = payload.rows.map((row: any) => {return row.doc as IBlankForm});
            const templateFormDoc = blankFormDocs.find((templateDoc: IBlankForm) => {
                return templateDoc.form.name === formName;
            })
            return templateFormDoc;
        }).catch(err => {return err})
    }
    getPreviousVisits() {
        // return Promise.all([this.combineOsVisitsOfCurrentType(), this.archivedVisitsOfCurrentType()]).then(([activeVisits, archivedVisits]) => {
        //     return activeVisits.concat(archivedVisits);
        // }).catch(err => {
        //     return err;
        // });
        return Promise.all([this.combineOsVisitsOfCurrentType()]).then(([activeVisits]) => {
            return activeVisits;
        }).catch(err => {
            return err;
        });
    }
    archivedVisitsOfCurrentType() {
        return Promise.all([this.currentVisitName(), this.currentVisitTemplate()]).then(([currentVisitName, currentVisitTemplate]) => {
            return this.dao.archive().query("archiveFormsDesign/byClientAndName", {include_docs:true, key: [this.clientID, currentVisitName]}).then(payload => {
                const visitDocs = payload.rows.filter((row: any) => {
                    return row.doc._id !== this.formID
                }).map((row: any) => {
                    return row.doc
                });
                const orderedForms = FormUtil.orderFormsByDate(visitDocs);
                return orderedForms.map(doc => {
                    if (FormUtil.isCompressed(doc)) {
                        return FormUtil.expand(currentVisitTemplate, doc)
                    } else {
                        return doc
                    }
                });
                return orderedForms;
            }).catch( err => {throw err})
        }).catch(err => {throw err});

    }
    uncompressedPrevVisitFromArchive() {
        return Promise.all([this.currentVisitName(), this.currentVisitTemplate()]).then(([currentVisitName, currentVisitTemplate]) => {
            return this.dao.archive().query("archiveFormsDesign/byClientAndName", {include_docs:true, key: [this.clientID, currentVisitName]}).then(payload => {
                const visitDocs = payload.rows.filter((row: any) => {
                    return row.doc._id !== this.formID
                }).map((row: any) => {
                    return row.doc
                });
                if (visitDocs.length === 0) {
                    return null;
                } else {
                    const orderedForms = FormUtil.orderFormsByDate(visitDocs);
                    if (FormUtil.isCompressed(orderedForms[0])) {
                        return FormUtil.expand(currentVisitTemplate, orderedForms[0])
                    } else {
                        return orderedForms[0]
                    }
                }
            }).catch( err => {throw err})
        }).catch(err => {throw err});
    }
    combineOsVisitsOfCurrentType() {
        return Promise.all([this.osNames(), this.currentVisitName(), this.currentVisitTemplate()]).then(([osNames, visitName, visitTemplate]) => {

            const osAllDocPromises: Promise<any>[] = []
            osNames.forEach((name: any) => {
                osAllDocPromises.push(this.dao.visits(name).findAll({include_docs: true}).then(payload => {
                    const visitDocs = payload.rows.filter((row: any) => {
                        if (!row.doc._id.startsWith('_design') && !row.doc._id.startsWith('clients')) {
                            return (
                                (row.doc.form.name === visitName) &&
                                (row.doc._id !== this.formID) &&
                                (!row.doc._id.startsWith("54blankForm")) &&
                                (row.doc.form.client === this.clientID) &&
                                (row.doc.form.status[row.doc.form.status.length - 1].value !== 'open')
                            );
                        }
                    }).map((row: any) => {
                        return row.doc;
                    })

                    return visitDocs;
                }).catch(err => {
                    return err;
                }));
            })
            let visitsResult: any[] = []
            return Promise.all(osAllDocPromises).then(allDocsOfeachOs => {
                allDocsOfeachOs.forEach(osVisits => {
                    visitsResult = visitsResult.concat(osVisits);
                })

                const orderedForms = FormUtil.orderFormsByDate(visitsResult);
                return orderedForms.map(doc => {
                    if (FormUtil.isCompressed(doc)) {
                        return FormUtil.expand(visitTemplate, doc)
                    } else {
                        return doc
                    }
                });
            }).catch(err => {throw err})
        }).catch(err => {throw err})
    }
    currentVisitName() {
        if (this.formID.startsWith("54blankForm")) {
            return this.dao.forms().find(this.formID).then(doc => {
                return doc.form.name;
            }).catch( err => {throw err})
        } else {
            return this.dao.visits(this.userDBName).find(this.formID).then(doc => {
                return doc.form.name;
            }).catch(err => {throw err})
        }
    }

    currentVisitTemplate() {
        if (this.formID.startsWith("54blankForm")) {
            return this.dao.forms().find(this.formID).then(doc => {
                return doc;
            }).catch(err => {throw err})
        } else {
            return this.dao.visits(this.userDBName).find(this.formID).then(doc => {
                return this.dao.forms().find(doc.form.formID).then(doc => {
                    return doc;
                }).catch(err => {throw err})
            }).catch(err => {throw err})
        }
    }
    osNames() {
        return this.dao.users().findAll({include_docs: true}).then(payload => {
            return payload.rows.filter((row: any) => {
                return row.doc._id.startsWith("org.couchdb.user:") && row.doc.roles.indexOf("OS") > -1
            }).map((row:any)=> {
                return row.doc.name
            })
        }).catch(err => {throw err})
    }

    private expandForms(visitData: any) {
        if (FormUtil.isCompressed(visitData.currentVisit)) {
            visitData.currentVisit = FormUtil.expand(visitData.templateVisit, visitData.currentVisit)
        }

        if (FormUtil.isCompressed(visitData.prevVisit)) {
            visitData.prevVisit = FormUtil.expand(visitData.templateVisit, visitData.prevVisit)
        }

        return visitData;

    }


}
