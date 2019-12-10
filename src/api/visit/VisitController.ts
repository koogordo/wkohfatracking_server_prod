import express, { Request, Response } from 'express';
import { WKODbAccess } from '../../data/WKODbAccess';
import { DbConfig } from '../../config';
import { IWKORequest } from '../../server/WKOCommunication';
import OsDashboardBuilder from '../dashboard/utils/OsDashboardBuilder';
import RevDashboardBuilder from '../dashboard/utils/RevDashboardBuilder';
import AdminDashboardBuilder from '../dashboard/utils/AdminDashboardBuilder';
import {
    checkJwt,
    checkRole,
} from '../authentication/middleware/JwtMiddleware';
import OsViewVisitBuilder from './utils/OsViewVisitBuilder';
import FormUtil from '../../utils/FormUtil';
const VisitController = express.Router();
const dao = new WKODbAccess(DbConfig);
VisitController.post(
    '/viewvisit',
    [checkJwt],
    (req: Request, res: Response) => {
        if (!req.body.id) {
            res.status(400).json({
                err: `Missing request params "id"`,
                body: req.body,
            });
        }
        if (!req.body.userDBName) {
            res.status(400).json({
                err: `Missing request body value "userDBName"`,
                body: req.body,
            });
        }
        if (!req.body.clientID) {
            res.status(400).json({
                err: `Missing request body value "clientID"`,
                body: req.body,
            });
        }

        const osViewVisitBuilder = new OsViewVisitBuilder(
            dao,
            req.body.userDBName,
            req.body.id,
            req.body.clientID
        );
        osViewVisitBuilder
            .makeDisplayVisit()
            .then(visit => {
                res.status(200).json(visit);
            })
            .catch(err => {
                res.status(400).json({ err });
            });
    }
);

VisitController.post(
    '/prevvisits',
    [checkJwt],
    (req: Request, res: Response) => {
        if (!req.body.id) {
            res.status(400).json({
                err: `Missing request params "id"`,
                body: req.body,
            });
        }
        if (!req.body.userDBName) {
            res.status(400).json({
                err: `Missing request body value "userDBName"`,
                body: req.body,
            });
        }
        if (!req.body.clientID) {
            res.status(400).json({
                err: `Missing request body value "clientID"`,
                body: req.body,
            });
        }

        const osViewVisitBuilder = new OsViewVisitBuilder(
            dao,
            req.body.userDBName,
            req.body.id,
            req.body.clientID
        );
        osViewVisitBuilder
            .getPreviousVisits()
            .then(prevVisits => {
                res.status(200).json(prevVisits);
            })
            .catch(err => {
                res.status(400).json({
                    ok: false,
                    err,
                });
            });
    }
);

VisitController.post(
    '/previousarchivedvisit',
    [checkJwt],
    (req: Request, res: Response) => {
        if (!req.body.id) {
            res.status(400).json({
                err: `Missing request params "id"`,
                body: req.body,
            });
        }
        if (!req.body.userDBName) {
            res.status(400).json({
                err: `Missing request body value "userDBName"`,
                body: req.body,
            });
        }
        if (!req.body.clientID) {
            res.status(400).json({
                err: `Missing request body value "clientID"`,
                body: req.body,
            });
        }

        const osViewVisitBuilder = new OsViewVisitBuilder(
            dao,
            req.body.userDBName,
            req.body.id,
            req.body.clientID
        );
        osViewVisitBuilder
            .uncompressedPrevVisitFromArchive()
            .then(archivedPrevVisit => {
                res.status(200).json({ newPrevVisit: archivedPrevVisit });
            })
            .catch(err => {
                console.log(err);
                res.status(400).json({
                    ok: false,
                    err,
                });
            });
    }
);

VisitController.post(
    '/previousactivevisit',
    [checkJwt],
    (req: Request, res: Response) => {
        if (!req.body.id) {
            res.status(400).json({
                err: `Missing request params "id"`,
                body: req.body,
            });
        }
        if (!req.body.userDBName) {
            res.status(400).json({
                err: `Missing request body value "userDBName"`,
                body: req.body,
            });
        }
        if (!req.body.clientID) {
            res.status(400).json({
                err: `Missing request body value "clientID"`,
                body: req.body,
            });
        }
        const osViewVisitBuilder = new OsViewVisitBuilder(
            dao,
            req.body.userDBName,
            req.body.id,
            req.body.clientID
        );
        osViewVisitBuilder
            .combineOsVisitsOfCurrentTypeIncludeCurrentID()
            .then(visitOfType => {
                res.status(200).json({ newPrevVisit: visitOfType[0] });
            })
            .catch(err => {
                res.status(400).json({
                    ok: false,
                    err,
                });
            });
    }
);

VisitController.get(
    '/:clientid/:visitname/:os',
    [checkJwt],
    (req: Request, res: Response) => {
        if (!req.params.clientid) {
            res.status(400).json({
                err: `Missing request params "id"`,
                body: req.body,
            });
        }
        if (!req.params.visitname) {
            res.status(400).json({
                err: `Missing request body value "userDBName"`,
                body: req.body,
            });
        }
        if (!req.params.os) {
            res.status(400).json({
                err: `Missing request body value "clientID"`,
                body: req.body,
            });
        }

        if (req.params.os !== 'ignore') {
            dao.visits(req.params.os)
                .query('index/byClientIDVisitType', {
                    include_docs: true,
                    key: [req.params.clientid, req.params.visitname],
                })
                .then(payload => {
                    res.status(200).json(payload);
                })
                .catch(err => {
                    res.status(400).json(err);
                });
        } else {
            dao.users()
                .query('review_groups/byRole', {
                    include_docs: false,
                    key: 'OS',
                })
                .then(usersPayload => {
                    const userDBNames = usersPayload.rows.map((row: any) => {
                        return row.id.split(':')[1];
                    });
                    const visitPromises = userDBNames.map((name: any) => {
                        return dao
                            .visits(name)
                            .query('index/byClientIDVisitType', {
                                include_docs: true,
                                key: [
                                    req.params.clientid,
                                    req.params.visitname,
                                ],
                            })
                            .then(payload => {
                                return payload;
                            })
                            .catch(err => {
                                return err;
                            });
                    });

                    Promise.all(visitPromises)
                        .then(visitPayloads => {
                            const resultPayload = visitPayloads.reduce(
                                (acc: any, cur: any, idx: number) => {
                                    acc.rows = acc.rows.concat(cur.rows);
                                    return acc;
                                }
                            );
                            res.status(200).json(resultPayload);
                        })
                        .catch(err => {
                            res.status(400).json(err);
                        });
                });
        }
    }
);
// VisitController.post("/question", (req: Request, res: Response) => {
//     const key = req.body.key;
//     const formID = req.body.formID;
//     dao.visits('os41').find(formID).then(formDoc => {
//         const q = FormUtil.getQuestionCompressedForm(key, formDoc);
//         res.status(200).json({result: q});
//     })
// })
// VisitController.get("/admin/viewform/:id", [checkJwt, checkRole("ADMIN")],(req: Request, res: Response) => {
// })

export default VisitController;
