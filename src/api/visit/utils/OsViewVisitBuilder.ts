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
        return this.dao.forms().find(this.formID).then((blankForm: IBlankForm) => {
            return this.dao.visits(this.userDBName).findAll({include_docs: true}).then(payload => {
                const visitRecords: any[] = (payload.rows as Array<any>).filter((row: any) => {
                    if (!row.doc._id.startsWith('_design') && !row.doc._id.startsWith('clients')) {
                        return (
                            (row.doc.form.name === blankForm.form.name) &&
                            (row.doc._id !== blankForm._id) &&
                            (row.doc.form.client === this.clientID) &&
                            (row.doc.form.status[row.doc.form.status.length - 1].value !== 'open')
                        );
                    }
                    return false;
                }).map((row: any) => {
                    return row.doc
                });
                const orderedForms = FormUtil.orderFormsByDate(visitRecords);
                let prevVisit;
                if (orderedForms.length > 0) {
                    prevVisit = orderedForms[0];
                } else {
                    prevVisit = null
                }
                const templateForm = JSON.parse(JSON.stringify(blankForm))
                const result: any = {
                    success: true,
                    visit: blankForm,
                    prevVisit: prevVisit,
                    templateForm: templateForm
                }
                return result;
            });
        }).catch(err => {throw err});
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
        })
    }
    getFormTemplate(formName: string) {
        return this.dao.forms().findAll({include_docs:true}).then(payload => {
            const blankFormDocs = payload.rows.map((row: any) => {return row.doc as IBlankForm});
            const templateFormDoc = blankFormDocs.find((templateDoc: IBlankForm) => {
                return templateDoc.form.name === formName;
            })
            return templateFormDoc;
        })
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
