import express, {Request, Response} from 'express'
import { WKODbAccess} from "../../data/WKODbAccess";
import {DbConfig} from "../../config"
import {IWKORequest} from "../../server/WKOCommunication";
import OsDashboardBuilder from "./utils/OsDashboardBuilder";
import RevDashboardBuilder from "./utils/RevDashboardBuilder";
import AdminDashboardBuilder from "./utils/AdminDashboardBuilder";
import {checkJwt, checkRole} from "../authentication/middleware/JwtMiddleware";
const DashboardController = express.Router();
const router = express.Router();
const dao = new WKODbAccess(DbConfig);
DashboardController.get('/osdashboard/:id', [checkJwt], (req: Request, res: Response) => {
  
    const username = req.params.id || null;
    let userDB;

    if (username) {userDB = req.params.id.split(":")[1].toLowerCase();}
    else {userDB = null};

    if (username && userDB) {
        const osDashBuilder = new OsDashboardBuilder(dao, username, userDB, false);
        osDashBuilder.buildDashboard().then(fams => {
            res.json(fams);
        }).catch(err => {
            res.json(err);
        });

    } else {
        res.json(new Error(`user ${username} has no dash data, user not found.`))
    }
})
//
DashboardController.get('/revdashboard/:id', [checkJwt, checkRole("REVIEWER")], (req: Request, res: Response) => {
    
    const username = req.params.id || null;

    if (username) {
        const revDashBuilder = new RevDashboardBuilder(dao, username);
        revDashBuilder.buildDashboard().then(reviewerOses => {
            res.status(200).json(reviewerOses);
        }).catch(err => {
            res.status(400).json(err);
        });

    } else {
        res.status(400).json({err: `user ${username} has no dash data, user not found.`})
    }
})
//
DashboardController.get('/admindashboard/:id', [checkJwt, checkRole("_admin")],(req: Request, res: Response) => {
    
    const username = req.params.id || null;

    if (username) {
        const adminDashBuilder = new AdminDashboardBuilder(dao, username);
        adminDashBuilder.buildDashboard().then(queuedVisits => {
            res.json(queuedVisits);
        }).catch(err => {
            res.json(err);
        });

    } else {
        res.json(new Error(`user ${username} has no dash data, user not found.`))
    }
})
export default DashboardController;
//
// export const makeOsDashboard = (req: IWKORequest) => {
//     const osDashBuilder = new OsDashboardBuilder(dao, req.reqUser, req.userDB);
//     osDashBuilder.buildDashboard();
// }
