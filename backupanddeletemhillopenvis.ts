import { WKODbAccess } from './src/data/WKODbAccess';
import { DbConfig } from './src/config';
import PouchDB from 'pouchdb';
const dao = new WKODbAccess(DbConfig);
const bdb = new PouchDB(`${DbConfig.domain}/mhill-open`);
dao.visits('os-mhill')
    .query('index/byVisitStatus', { key: 'open', include_docs: true })
    .then((p: any) => {
        const backupDocs = p.rows.map((row: any) => {
            return {
                _id: row.doc._id,
                form: row.doc.form,
            };
        });
        const deletDocs = p.rows.map((row: any) => {
            row.doc._deleted = true;
            return row.doc;
        });

        dao.visits('os-mhill')
            .createAll(deletDocs)
            .then(backRes => {
                console.log(backRes);
            });
    });
