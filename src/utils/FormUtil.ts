import {
    IColumn,
    IForm,
    IOption,
    IQuestion,
    IRow,
    ISection,
    ITab,
    IVisit,
} from '../data/Repository';
import moment from 'moment';

export default class FormUtil {
    public static indexQuestionGroup(
        fgValue: any,
        key: any,
        indexc: any[] = []
    ) {
        const index = JSON.parse(JSON.stringify(indexc));
        if (fgValue.key === key) {
            return index;
        }

        if (fgValue.tabs) {
            index.push({ type: 'tab' });
            return this.indexFormPartChildren(fgValue.tabs, key, index);
        } else if (fgValue.sections) {
            index.push({ type: 'section' });
            return this.indexFormPartChildren(fgValue.sections, key, index);
        } else if (fgValue.rows && fgValue.type !== 'question-array') {
            index.push({ type: 'row' });
            return this.indexFormPartChildren(fgValue.rows, key, index);
        } else if (fgValue.input && fgValue.type === 'question-array') {
            index.push({ type: 'input' });
            return this.indexFormPartChildren(fgValue.input, key, index);
            // return this.indexFormPartChildren(fgValue.input[0].rows, key, index);
        } else if (fgValue.columns) {
            index.push({ type: 'column' });
            return this.indexFormPartChildren(fgValue.columns, key, index);
        } else if (fgValue.options) {
            index.push({ type: 'option' });
            return this.indexFormPartChildren(fgValue.options, key, index);
        } else if (fgValue.questions) {
            index.push({ type: 'question' });
            return this.indexFormPartChildren(fgValue.questions, key, index);
        } else {
            return null;
        }
    }

    public static findFormPartByIndex(fgValue: any, indexc: any): any {
        const index = JSON.parse(JSON.stringify(indexc));
        const itype = index[0].type;

        if (itype === 'tab') {
            const tabIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[tabIndex[0].index];
            } else {
                return this.findFormPartByIndex(
                    fgValue.tabs[tabIndex[0].index],
                    index
                );
            }
        } else if (itype === 'section') {
            const sectIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[sectIndex[0].index];
            } else {
                return this.findFormPartByIndex(
                    fgValue.sections[sectIndex[0].index],
                    index
                );
            }
        } else if (itype === 'input') {
            const inputIndex = index.splice(0, 1);
            const rowIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[inputIndex[0].index];
            } else {
                return this.findFormPartByIndex(
                    fgValue.input[inputIndex[0].index].rows[rowIndex[0].index],
                    index
                );
            }
        } else if (itype === 'row') {
            const rowIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[rowIndex[0].index];
            } else {
                return this.findFormPartByIndex(
                    fgValue.rows[rowIndex[0].index],
                    index
                );
            }
        } else if (itype === 'option') {
            const optIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[optIndex[0].index];
            } else {
                return this.findFormPartByIndex(
                    fgValue.options[optIndex[0].index],
                    index
                );
            }
        } else if (itype === 'column') {
            const colIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[colIndex[0].index];
            } else {
                return this.findFormPartByIndex(
                    fgValue.columns[colIndex[0].index],
                    index
                );
            }
        } else if (itype === 'question') {
            const queIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[queIndex[0].index];
            } else {
                return this.findFormPartByIndex(
                    fgValue.questions[queIndex[0].index],
                    index
                );
            }
        } else {
            return null;
        }
    }
    public static isCompressed(visitDoc: IVisit) {
        return visitDoc.form.contents ? true : false;
    }

    public static orderFormsByDate(visitDocs: IVisit[]) {
        return visitDocs.sort((a: IVisit, b: IVisit) => {
            let aDate;
            let bDate;

            if (this.isCompressed(a)) {
                aDate = this.getCompressedFormVisitDate(a);
            } else {
                aDate = this.getFormVisitDate(a);
            }

            if (this.isCompressed(b)) {
                bDate = this.getCompressedFormVisitDate(b);
            } else {
                bDate = this.getFormVisitDate(b);
            }

            if (aDate.isAfter(bDate)) {
                return -1;
            } else if (aDate.isBefore(bDate)) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    public static makeArchiveDocFromFormDoc(form: IVisit) {
        const archiveDoc: any = {};
        archiveDoc._id = form._id;
        archiveDoc.visitRev;
        archiveDoc.client = form.form.client;
        archiveDoc.visitType = form.form.name;

        //recursively build archiveDoc
        return archiveDoc;
    }

    public static makeArchiveDoc(form: any, archiveDoc: any) {
        if (form.tabs) {
            for (const tabControl of form.tabs) {
                this.makeArchiveDoc(tabControl, archiveDoc);
            }
        } else if (form.sections) {
            for (const sectionControl of form.sections) {
                this.makeArchiveDoc(sectionControl, archiveDoc);
            }
        } else if (form.rows && form.type === 'question-array') {
            // (form as form).addControl('initialLoad', new FormControl(true));

            for (const inputControl of form.controls.input.controls) {
                for (const rowControl of inputControl.rows) {
                    this.makeArchiveDoc(rowControl, archiveDoc);
                }
            }
        } else if (form.rows && form.type !== 'question-array') {
            for (const rowControl of form.rows) {
                this.makeArchiveDoc(rowControl, archiveDoc);
            }
        } else if (form.columns) {
            for (const columnControl of form.columns) {
                this.makeArchiveDoc(columnControl, archiveDoc);
            }
        } else if (form.options) {
            for (const optionControl of form.options) {
                this.makeArchiveDoc(optionControl, archiveDoc);
            }
        } else if (form.questions) {
            form.questions.forEach((question: any) => {
                if (question.key === 'Income') {
                    let compressValue;
                    if (
                        question.indices.yearly &&
                        question.indices.yearly !== ''
                    ) {
                        compressValue = `yearly ${question.indices.yearly}`;
                    } else if (
                        question.indices.monthly &&
                        question.indices.monthly !== ''
                    ) {
                        compressValue = `monthly ${question.indices.monthly}`;
                    } else if (
                        question.indices.weekly &&
                        question.indices.weekly !== ''
                    ) {
                        compressValue = `weekly ${question.indices.weekly}`;
                    } else {
                        compressValue = '';
                    }
                    archiveDoc[question.key] = compressValue;
                } else {
                    archiveDoc[question.key] = question.input;
                }
                if (question.options) {
                    for (const optionControl of question.options) {
                        if (optionControl.rows.length > 0) {
                            this.makeArchiveDoc(optionControl, archiveDoc);
                        }
                    }
                } else if (
                    question.rows &&
                    question.type === 'question-array'
                ) {
                    for (const inputControl of question.input) {
                        for (const rowControl of inputControl.rows) {
                            this.makeArchiveDoc(rowControl, archiveDoc);
                        }
                    }
                } else if (
                    question.rows &&
                    question.type !== 'question-array'
                ) {
                    for (const rowControl of question.rows) {
                        this.makeArchiveDoc(rowControl, archiveDoc);
                    }
                }
            });
        }
    }

    public static compress(form: any, compressedForm: any = {}): any {
        if (Object.keys(compressedForm).length === 0) {
            for (const prop in form) {
                if (prop !== 'tabs') {
                    compressedForm[prop] = form[prop];
                }
            }
            compressedForm.contents = [];
        }
        if (form.tabs) {
            for (const tabControl of form.tabs) {
                this.compress(tabControl, compressedForm);
            }
        } else if (form.sections) {
            for (const sectionControl of form.sections) {
                this.compress(sectionControl, compressedForm);
            }
        } else if (form.rows && form.type === 'question-array') {
            // (form as form).addControl('initialLoad', new FormControl(true));

            for (const inputControl of form.controls.input.controls) {
                for (const rowControl of inputControl.rows) {
                    this.compress(rowControl, compressedForm);
                }
            }
        } else if (form.rows && form.type !== 'question-array') {
            for (const rowControl of form.rows) {
                this.compress(rowControl, compressedForm);
            }
        } else if (form.columns) {
            for (const columnControl of form.columns) {
                this.compress(columnControl, compressedForm);
            }
        } else if (form.options) {
            for (const optionControl of form.options) {
                this.compress(optionControl, compressedForm);
            }
        } else if (form.questions) {
            form.questions.forEach((question: any) => {
                if (question.key === 'Income') {
                    let compressValue;
                    if (
                        question.indices.yearly &&
                        question.indices.yearly !== ''
                    ) {
                        compressValue = `yearly ${question.indices.yearly}`;
                    } else if (
                        question.indices.monthly &&
                        question.indices.monthly !== ''
                    ) {
                        compressValue = `monthly ${question.indices.monthly}`;
                    } else if (
                        question.indices.weekly &&
                        question.indices.weekly !== ''
                    ) {
                        compressValue = `weekly ${question.indices.weekly}`;
                    } else {
                        compressValue = '';
                    }
                    compressedForm.contents.push({
                        key: question.key,
                        value: compressValue,
                        notes: question.notes || [],
                        usePreviousValue: question.usePreviousValue,
                    });
                } else {
                    compressedForm.contents.push({
                        key: question.key,
                        value: question.input,
                        notes: question.notes || [],
                        usePreviousValue: question.usePreviousValue,
                    });
                }
                if (question.options) {
                    for (const optionControl of question.options) {
                        if (optionControl.rows.length > 0) {
                            this.compress(optionControl, compressedForm);
                        }
                    }
                } else if (
                    question.rows &&
                    question.type === 'question-array'
                ) {
                    for (const inputControl of question.input) {
                        for (const rowControl of inputControl.rows) {
                            this.compress(rowControl, compressedForm);
                        }
                    }
                } else if (
                    question.rows &&
                    question.type !== 'question-array'
                ) {
                    for (const rowControl of question.rows) {
                        this.compress(rowControl, compressedForm);
                    }
                }
            });
        }
        return compressedForm;
    }

    public static expand(templateFormDoc: IVisit, compressedForm: IVisit) {
        const formCopy = JSON.parse(JSON.stringify(templateFormDoc));
        for (const prop in formCopy.form) {
            if (prop !== 'tabs') {
                formCopy.form[prop] = compressedForm.form[prop];
            }
        }

        for (const question of compressedForm.form.contents) {
            const index = this.indexQuestionGroup(formCopy.form, question.key);
            const formPart = this.findFormPartByIndex(formCopy.form, index);
            if (question.key === 'Income') {
                const income = question.value.split(' ');
                if (income[0] === 'yearly') {
                    formPart.indices.yearly = income[1];
                } else if (income[0] === 'monthly') {
                    formPart.indices.monthly = income[1];
                } else if (income[0] === 'weekly') {
                    formPart.indices.weekly = income[1];
                }
            } else {
                formPart.input = question.value;
            }
            formPart.notes = question.notes;
            formPart.usePreviousValue = question.usePreviousValue;
        }
        formCopy._id = compressedForm._id;
        formCopy._rev = compressedForm._rev;
        return formCopy;
    }
    public static getQuestionCompressedForm(key: string, visit: IVisit) {
        const q = visit.form.contents.find((compressedQuestion: any) => {
            return compressedQuestion.key === key;
        });

        if (!q) {
            return null;
        }

        return q;
    }
    public static setQuestionValueCompressedForm(
        key: string,
        visit: IVisit,
        value: any
    ) {
        const q = visit.form.contents.find((compressedQuestion: any) => {
            return compressedQuestion.key === key;
        });

        if (!q) {
            throw new Error('Question not found');
        }
        q.value = value;
    }
    public static mergePreviousVisitIntoNew(
        newVisit: IVisit,
        prevVisit: IVisit
    ) {
        prevVisit.form.contents.forEach((compQuestion: any) => {
            const newVisitQ = this.getQuestionCompressedForm(
                compQuestion.key,
                newVisit
            );
            if (newVisitQ && !newVisitQ.usePreviousValue) {
                newVisitQ.value = compQuestion.value;
            }
        });
    }
    public static findQuestion(
        key: string,
        formComponent:
            | IForm
            | ITab
            | ISection
            | IRow
            | IColumn
            | IQuestion
            | IOption
    ) {
        //doesnt fully work
        if (this.isQuestionNode(formComponent)) {
            const q = formComponent as IQuestion;
            if (q.key === key) {
                return q;
            }

            if (this.isQuestionWithRows(q)) {
                if (q.type === 'question-array') {
                    q.input.forEach((input: ISection) => {
                        this.findQuestion(key, input);
                    });
                } else {
                    q.rows!.forEach((row: IRow) => {
                        this.findQuestion(key, row);
                    });
                }
            }

            if (this.isQuestionWithOptions(q)) {
                q.options!.forEach(opt => {
                    this.findQuestion(key, opt);
                });
            }
            return null;
        }

        if (this.isFormNode(formComponent)) {
            const node = formComponent as IForm;
            node.tabs.forEach(tab => {
                this.findQuestion(key, tab);
            });
        } else if (this.isTabNode(formComponent)) {
            const node = formComponent as ITab;
            node.sections.forEach((section: ISection) => {
                this.findQuestion(key, section);
            });
        } else if (this.isSectionNode(formComponent)) {
            const node = formComponent as ISection;
            node.rows.forEach((row: IRow) => {
                this.findQuestion(key, row);
            });
        } else if (this.isRowNode(formComponent)) {
            const node = formComponent as IRow;
            node.columns.forEach((column: IColumn) => {
                this.findQuestion(key, column);
            });
        } else if (this.isColumnNode(formComponent)) {
            const node = formComponent as IColumn;
            node.questions.forEach((question: IQuestion) => {
                this.findQuestion(key, question);
            });
        } else if (this.isOptionNode(formComponent)) {
            const node = formComponent as IOption;
            node.rows.forEach((row: IRow) => {
                this.findQuestion(key, row);
            });
        } else {
            return null;
        }
    }

    private static isFormNode(node: any) {
        if (node.tabs) {
            return true;
        } else {
            return false;
        }
    }
    private static isTabNode(node: any) {
        if (node.sections) {
            return true;
        } else {
            return false;
        }
    }
    private static isSectionNode(node: any) {
        if (node.rows && !node.type) {
            return true;
        } else {
            return false;
        }
    }
    private static isRowNode(node: any) {
        if (node.columns) {
            return true;
        } else {
            return false;
        }
    }
    private static isColumnNode(node: any) {
        if (node.questions) {
            return true;
        } else {
            return false;
        }
    }
    private static isQuestionNode(node: any) {
        if (node.type && node.key && node.label) {
            return true;
        } else {
            return false;
        }
    }
    private static isOptionNode(node: any) {
        if (node.key && node.value && !node.label) {
            return true;
        } else {
            return false;
        }
    }
    private static isQuestionWithRows(node: any) {
        if (node.rows) {
            return true;
        } else {
            return false;
        }
    }
    private static isQuestionWithOptions(node: any) {
        if (node.options) {
            return true;
        } else {
            return false;
        }
    }
    private static getCompressedFormVisitDate(visitDoc: IVisit) {
        const visitDateQ = visitDoc.form.contents.find((question: any) => {
            return question.key === 'Visit Date';
        });
        return moment(visitDateQ.value);
    }
    private static getFormVisitDate(visitDoc: IVisit) {
        const visDateIndex = FormUtil.indexQuestionGroup(
            visitDoc.form,
            'Visit Date'
        );
        const visitDateQ = FormUtil.findFormPartByIndex(
            visitDoc.form,
            visDateIndex
        );
        return moment(visitDateQ.input);
    }
    private static indexFormPartChildren(
        formPartChildren: any,
        key: any,
        index: any
    ): any {
        for (const childIndex in formPartChildren) {
            let tempIndex = index;
            tempIndex[tempIndex.length - 1].index = childIndex;
            const temp = this.indexQuestionGroup(
                formPartChildren[childIndex],
                key,
                tempIndex
            );
            if (temp) {
                return temp;
            }
        }
        return null;
    }
}
