import express, { Request, Response } from 'express';
import { WKODbAccess } from '../../data/WKODbAccess';
import { DbConfig } from '../../config';
import { jwtSecret } from '../../config';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { extractTokenFromAuthHeader } from './middleware/JwtMiddleware';
const dao = new WKODbAccess(DbConfig);

const AuthController = express.Router();

AuthController.post('/login', (req, res) => {
    let { username, password } = req.body;
    if (!(username && password)) {
        res.status(400).json({
            err: 'Invalid login request body',
            body: req.body,
        });
    }

    dao.users()
        .find(username)
        .then(user => {
            try {
                if (!bcrypt.compareSync(password, user.apipassword)) {
                    res.status(400).json({ err: 'Password Incorrect' });
                }
                const token = jwt.sign(
                    { roles: user.roles, username: user._id, password },
                    jwtSecret
                );

                //Send the jwt in the response
                res.status(200).json({ success: true, user: user, token });
            } catch (e) {
                res.status(400).json(e);
            }
        })
        .catch(err => {
            if (err.error === 'not_found') {
                res.status(400).json({ err: 'Username Incorrect' });
            }
            res.status(400).json({ err });
        });
});

AuthController.post('/', (req: Request, res: Response) => {
    let jwtPayload;
    // Try to validate the token and get data

    try {
        jwtPayload = <any>jwt.verify(req.body.token, jwtSecret);

        res.locals.jwtPayload = jwtPayload;
        dao.users()
            .find(jwtPayload.username)
            .then(user => {
                res.status(200).json({
                    authenticated: true,
                    user,
                    token: req.body.token,
                });
            })
            .catch(err => {
                res.status(400).json({ authenticated: false });
            });
    } catch (error) {
        // If token is not valid, respond with 401 (unauthorized)
        res.status(200).json({ authenticated: false });
    }
});

export default AuthController;
