import { IWKONotification } from "../server/WKOCommunication";
const pouchCollate = require("pouchdb-collate");
export class DashData {
    private data: any;
    private user: string;
    private userType: string;
    constructor(data: any, user: string, userType: string) {
        this.data = data;
        this.user = user;
        this.userType = userType;
    }
    public getData() {
        return this.data;
    }
    public setData(data: any) {
        this.data = data;
    }
    public toIWKODashData() {
        return {
            data: this.data,
            userType: this.userType,
            username: this.user,
        };
    }
    public mergeNotification(data: IWKONotification) {
        console.log(this.userType);
        if (this.userType === "os") {
            this.makeOsNotifyChanges(data);
        } else if (this.userType === "reviewer") {
            this.makeReviewerNotifyChanges(data);
        }
    }
    private makeReviewerNotifyChanges(data: IWKONotification) {
        const changeToForm = data.newForm;
        console.log(`findClientInReviewer(${data.changedBy.split(":")[1]}, ${changeToForm.form.client})`);
        const client = this.findClientInReviewer(data.changedBy.split(":")[1], changeToForm.form.client);

        if (client) {
            // tslint:disable-next-line: max-line-length
            const allForms = client.forms.TransitionForms.concat(client.forms.ReviewForms.concat(client.forms.CompleteForms));
            console.log(allForms);
            const oldStatus = this.getOldFormStatus(allForms, data.newForm._id);
            const newStatus = data.newForm.form.status[data.newForm.form.status.length - 1].value;
            this.deleteOldForm(client, oldStatus, data.newForm._id, "fromReviewer");
            this.addNewForm(client, newStatus, data.newForm, "fromReviewer");
        }
    }

    private makeOsNotifyChanges(data: IWKONotification) {
        const changeToForm = data.newForm;
        const client = this.findClientInOs(changeToForm.form.client);

        if (client) {
            const allForms = client.forms.TransitionForms.concat(client.forms.ActiveForms.concat(client.forms.LockedForms));
            console.log(allForms);
            const oldStatus = this.getOldFormStatus(allForms, data.newForm._id);
            const newStatus = data.newForm.form.status[data.newForm.form.status.length - 1].value;
            this.deleteOldForm(client, oldStatus, data.newForm._id, "fromOS");
            this.addNewForm(client, newStatus, data.newForm, "fromOS");
        }
    }

    private getOldFormStatus(forms: any, changeToForm: any) {
        // tslint:disable-next-line: forin
        for (const i in forms) {
            console.log(changeToForm._id, forms[i]._id);
            if (changeToForm === forms[i]._id) {
                return forms[i].form.status[forms[i].form.status.length - 1].value;
            }
        }
        return null;
    }

    private deleteOldForm(client: any, oldStatus: any, id: any, who: any) {
        let statuses: any;
        let caseZeroForms;
        let caseOneForms;
        let caseTwoForms;
        let caseThreeForms;
        let caseFourForms;
        if (who === "fromReviewer") {
            statuses = {
                open: 0,
                "action required": 1,
                permanent: 3,
                queued: 2,
                "reviewer pool": 2,
                "under review": 2,
                submitted: 1,
            };
            caseZeroForms = null;
            caseOneForms = client.forms.TransitionForms;
            caseTwoForms = client.forms.ReviewForms;
            caseThreeForms = client.forms.CompleteForms;
            caseFourForms = null;
        } else {
            statuses = {
                open: 0,
                "action required": 1,
                permanent: 4,
                queued: 3,
                "reviewer pool": 2,
                "under review": 2,
                submitted: 1,
            };

            caseZeroForms = client.forms.ActiveForms;
            caseOneForms = client.forms.TransitionForms;
            caseTwoForms = client.forms.LockedForms;
            caseThreeForms = client.forms.LockedForms;
            caseFourForms = client.forms.LockedForms;
        }
        if (oldStatus) {
            switch (statuses[oldStatus]) {
                case 0: {
                    const deleteIndex = caseZeroForms
                        .map((form: any) => {
                            return form._id;
                        })
                        .indexOf(id);
                    if (deleteIndex >= 0) {
                        caseZeroForms.splice(deleteIndex, 1);
                    }
                    break;
                }
                case 1: {
                    const deleteIndex = caseOneForms
                        .map((form: any) => {
                            return form._id;
                        })
                        .indexOf(id);
                    if (deleteIndex >= 0) {
                        caseOneForms.splice(deleteIndex, 1);
                    }
                    break;
                }
                case 2: {
                    const deleteIndex = caseTwoForms
                        .map((form: any) => {
                            return form._id;
                        })
                        .indexOf(id);
                    if (deleteIndex >= 0) {
                        caseTwoForms.splice(deleteIndex, 1);
                    }
                    break;
                }
                case 3: {
                    const deleteIndex = caseThreeForms
                        .map((form: any) => {
                            return form._id;
                        })
                        .indexOf(id);
                    if (deleteIndex >= 0) {
                        caseThreeForms.splice(deleteIndex, 1);
                    }
                    break;
                }
                case 4: {
                    const deleteIndex = caseFourForms
                        .map((form: any) => {
                            return form._id;
                        })
                        .indexOf(id);
                    if (deleteIndex >= 0) {
                        caseFourForms.splice(deleteIndex, 1);
                    }
                    break;
                }
            }
        }
    }

    private addNewForm(client: any, newStatus: any, newForm: any, who: any) {
        let statuses: any;
        let caseZeroForms;
        let caseOneForms;
        let caseTwoForms;
        let caseThreeForms;
        let caseFourForms;
        if (who === "fromReviewer") {
            statuses = {
                open: 0,
                "action required": 1,
                permanent: 3,
                queued: 2,
                "reviewer pool": 2,
                "under review": 2,
                submitted: 1,
            };
            caseZeroForms = null;
            caseOneForms = client.forms.TransitionForms;
            caseTwoForms = client.forms.ReviewForms;
            caseThreeForms = client.forms.CompleteForms;
            caseFourForms = null;
        } else {
            statuses = {
                open: 0,
                "action required": 1,
                permanent: 4,
                queued: 3,
                "reviewer pool": 2,
                "under review": 2,
                submitted: 1,
            };

            caseZeroForms = client.forms.ActiveForms;
            caseOneForms = client.forms.TransitionForms;
            caseTwoForms = client.forms.LockedForms;
            caseThreeForms = client.forms.LockedForms;
            caseFourForms = client.forms.LockedForms;
        }
        if (newStatus) {
            switch (statuses[newStatus]) {
                case 0: {
                    caseZeroForms.push(newForm);
                    break;
                }
                case 1: {
                    caseOneForms.push(newForm);
                    break;
                }
                case 2: {
                    caseTwoForms.push(newForm);
                    break;
                }
                case 3: {
                    caseThreeForms.push(newForm);
                    break;
                }
                case 4: {
                    caseFourForms.push(newForm);
                    break;
                }
            }
        }
    }

    private findClientInOs(id: any) {
        const parsedID = pouchCollate.parseIndexableString(decodeURI(id));
        for (let i in this.data) {
            if (this.data[i].familyID === parsedID[0]) {
                return this.data[i][parsedID[1]][parsedID[2]];
            }
        }
        return null;
    }

    private findClientInReviewer(os: any, id: any) {
        const parsedID = pouchCollate.parseIndexableString(decodeURI(id));
        for (let i in this.data) {
            if (this.data[i].OSUsername === os) {
                for (let j in this.data[i].families) {
                    console.log(this.data[i].families[j]);
                    if (this.data[i].families[j].familyID === parsedID[0]) {
                        return this.data[i].families[j][parsedID[1]][parsedID[2]];
                    }
                }
            }
        }
        return null;
    }
}
