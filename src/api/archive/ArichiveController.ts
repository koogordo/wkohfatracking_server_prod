import express, { Request, Response } from 'express';
import { WKODbAccess } from '../../data/WKODbAccess';
import { DbConfig } from '../../config';
import { jwtSecret } from '../../config';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { json } from 'body-parser';
import { checkJwt } from '../authentication/middleware/JwtMiddleware';
import { start } from 'repl';

const ArchiveController = express.Router();

ArchiveController.get(
    '/:clientid/:visitname/:os/:startdate/:enddate',
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
        if (!req.params.startdate) {
            res.status(400).json({
                err: `Missing request body value "clientID"`,
                body: req.body,
            });
        }
        if (!req.params.enddate) {
            res.status(400).json({
                err: `Missing request body value "clientID"`,
                body: req.body,
            });
        }
        const dao = new WKODbAccess(DbConfig);
        const startKey = [
            req.params.clientid,
            req.params.visitname,
            req.params.startdate,
        ];
        if (req.params.os !== 'ignore') {
            startKey.push(req.params.os);
        }
        const endKey = [
            req.params.clientid,
            req.params.visitname,
            req.params.enddate,
            req.params.os === 'ignore' ? {} : req.params.os,
        ];

        dao.archive()
            .query('archiveFormsDesign/reportFormat', {
                include_docs: true,
                startkey: startKey,
                endkey: endKey,
            })
            .then((result: any) => {
                res.status(200).json(result);
            });
    }
);
export default ArchiveController;
