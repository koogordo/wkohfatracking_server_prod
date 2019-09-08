import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { jwtSecret } from "../../../config";

export function extractTokenFromAuthHeader(auth: string) {
    if (!auth) {
        throw new Error("Could not extract token from header")
    }
    return auth.split(" ")[1];
}
export const checkJwt= (req: Request, res: Response, next: NextFunction) => {
    const token = extractTokenFromAuthHeader(<string>req.headers["authorization"]);

    let jwtPayload;
    //Try to validate the token and get data
    try {
        jwtPayload = <any>jwt.verify(token, jwtSecret);
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        //If token is not valid, respond with 401 (unauthorized)
        res.status(401).json({err: error});
    }

    //The token is valid for 1 hour
    //We want to send a new token on every request
    const { roles, username } = jwtPayload;
    const newToken = jwt.sign({ roles, username }, jwtSecret, {
        expiresIn: "1h"
    });
    res.setHeader("token", newToken);

    //Call the next middleware or controller
    next();
}

export const checkRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = extractTokenFromAuthHeader(<string>req.headers["authorization"]);
        let jwtPayload;

        //Try to validate the token and get data
        try {
            jwtPayload = <any>jwt.verify(token, jwtSecret);
            res.locals.jwtPayload = jwtPayload;
        } catch (error) {
            //If token is not valid, respond with 401 (unauthorized)
            res.status(401).json({err: new Error("User doesn't have correct role"), roles: jwtPayload.roles});
            return;
        }

        //The token is valid for 1 hour
        //We want to send a new token on every request
        const { roles, username } = jwtPayload;
        if (roles.indexOf(role) > -1) {
            next();
        } else {
            res.status(309).json(new Error("User does not have appropriate role"));
        }
    }
}


