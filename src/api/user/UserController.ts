import express, { Request, Response } from 'express';
import { WKODbAccess } from '../../data/WKODbAccess';
import { DbConfig } from '../../config';
import { jwtSecret } from '../../config';
import * as jwt from 'jsonwebtoken';
import { IOsClients, IUser } from '../../data/Repository';

const dao = new WKODbAccess(DbConfig);
import * as bcrypt from 'bcryptjs';
import {
    checkJwt,
    checkRole,
} from '../authentication/middleware/JwtMiddleware';
import ClientAssignmentEditor from './ClientAssignmentEditor';
const UserController = express.Router();

UserController.post(
    '/register',
    /* [checkJwt, checkRole("ADMIN")], */ (req: Request, res: Response) => {
        if (!req.body) {
            res.status(400).json({
                err: new Error('Invalid request body'),
                body: req.body,
            });
        }
        const newUser: IUser = req.body;

        const salt = bcrypt.genSaltSync(10);
        newUser.apipassword = bcrypt.hashSync(req.body.password, salt);

        dao.users()
            .find(req.body._id)
            .then(user => {
                res.status(400).json({
                    err: 'User already exists',
                    username: newUser._id,
                });
            })
            .catch(err => {
                if (!(err.error === 'not_found')) {
                    res.status(400).json({ ok: false, err: err });
                }
                dao.users()
                    .create(req.body)
                    .then(createRes => {
                        res.status(200).json({ success: true, user: newUser });
                    })
                    .catch(err => {
                        res.status(400).json({ ok: false, err: err });
                    });
            });
    }
);

UserController.post(
    '/assignfamilies',
    [checkJwt],
    (req: Request, res: Response) => {
        if (!req.body) {
            res.status(400).json({
                err: 'Invalid request body',
                body: req.body,
            });
        }
        const assignmentEditor = new ClientAssignmentEditor(dao);
        assignmentEditor
            .verifyFamilies(req.body.families)
            .then(verification => {
                assignmentEditor
                    .assignFamilies(verification.valid, req.body.userDBName)
                    .then((result: any) => {
                        result.valid = verification.valid;
                        result.invalid = verification.invalid;
                        if (result.success) {
                            res.status(200).json(result);
                        } else {
                            res.status(400).json(result);
                        }
                    });
            });
    }
);

UserController.post(
    '/deassignfamilies',
    [checkJwt],
    (req: Request, res: Response) => {
        if (!req.body) {
            res.status(400).json({
                err: 'Invalid request body',
                body: req.body,
            });
        }
        const assignmentEditor = new ClientAssignmentEditor(dao);
        assignmentEditor
            .verifyFamilies(req.body.families)
            .then(verification => {
                assignmentEditor
                    .deassignFamilies(verification.valid, req.body.userDBName)
                    .then((result: any) => {
                        result.valid = verification.valid;
                        result.invalid = verification.invalid;
                        if (result.success) {
                            res.status(200).json(result);
                        } else {
                            res.status(400).json(result);
                        }
                    });
            });
    }
);

export default UserController;
