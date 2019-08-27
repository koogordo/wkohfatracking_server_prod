export default class FormUtil {
    public static indexQuestionGroup(fgValue: any, key: any, indexc: any[] = []) {
        const index = JSON.parse(JSON.stringify(indexc));
        if (fgValue.key === key) {
            return index;
        }

        if (fgValue.tabs) {
            index.push({ type: "tab" });
            return this.indexFormPartChildren(fgValue.tabs, key, index);
        } else if (fgValue.sections) {
            index.push({ type: "section" });
            return this.indexFormPartChildren(fgValue.sections, key, index);
        } else if (fgValue.rows && fgValue.type !== "question-array") {
            index.push({ type: "row" });
            return this.indexFormPartChildren(fgValue.rows, key, index);
        } else if (fgValue.input && fgValue.type === "question-array") {
            index.push({ type: "input" });
            return this.indexFormPartChildren(fgValue.input, key, index);
            // return this.indexFormPartChildren(fgValue.input[0].rows, key, index);
        } else if (fgValue.columns) {
            index.push({ type: "column" });
            return this.indexFormPartChildren(fgValue.columns, key, index);
        } else if (fgValue.options) {
            index.push({ type: "option" });
            return this.indexFormPartChildren(fgValue.options, key, index);
        } else if (fgValue.questions) {
            index.push({ type: "question" });
            return this.indexFormPartChildren(fgValue.questions, key, index);
        } else {
            return null;
        }
    }

    public static findFormPartByIndex(fgValue: any, indexc: any): any {
        const index = JSON.parse(JSON.stringify(indexc));
        const itype = index[0].type;

        if (itype === "tab") {
            const tabIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[tabIndex[0].index];
            } else {
                return this.findFormPartByIndex(fgValue.tabs[tabIndex[0].index], index);
            }
        } else if (itype === "section") {
            const sectIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[sectIndex[0].index];
            } else {
                return this.findFormPartByIndex(fgValue.sections[sectIndex[0].index], index);
            }
        } else if (itype === "input") {
            const inputIndex = index.splice(0, 1);
            const rowIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[inputIndex[0].index];
            } else {
                return this.findFormPartByIndex(fgValue.input[inputIndex[0].index].rows[rowIndex[0].index], index);
            }
        } else if (itype === "row") {
            const rowIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[rowIndex[0].index];
            } else {
                return this.findFormPartByIndex(fgValue.rows[rowIndex[0].index], index);
            }
        } else if (itype === "option") {
            const optIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[optIndex[0].index];
            } else {
                return this.findFormPartByIndex(fgValue.options[optIndex[0].index], index);
            }
        } else if (itype === "column") {
            const colIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[colIndex[0].index];
            } else {
                return this.findFormPartByIndex(fgValue.columns[colIndex[0].index], index);
            }
        } else if (itype === "question") {
            const queIndex = index.splice(0, 1);
            if (index.length === 0) {
                return fgValue.questions[queIndex[0].index];
            } else {
                return this.findFormPartByIndex(fgValue.questions[queIndex[0].index], index);
            }
        } else {
            return null;
        }
    }
    public static isCompressed(form: any) {
        return form.contents ? true : false;
    }
    private static indexFormPartChildren(formPartChildren: any, key: any, index: any): any {
        for (const childIndex in formPartChildren) {
            let tempIndex = index;
            tempIndex[tempIndex.length - 1].index = childIndex;
            const temp = this.indexQuestionGroup(formPartChildren[childIndex], key, tempIndex);
            if (temp) {
                return temp;
            }
        }
        return null;
    }
}
