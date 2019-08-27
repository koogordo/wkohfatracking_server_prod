import express from 'express'
import { WKODbAccess} from "../../data/WKODbAccess";
import {DbConfig} from "../../config"
import {IWKORequest} from "../../server/WKOCommunication";
import OsDashboardBuilder from "../../data/OsDashboardBuilder";
import RevDashboardBuilder from "../../data/RevDashboardBuilder";
import AdminDashboardBuilder from "../../data/AdminDashboardBuilder";
const DashboardController = express.Router();
const router = express.Router();
const dao = new WKODbAccess(DbConfig);
DashboardController.get('/osdashboard/:id', (req, res) => {
    console.log("reached endpoint with id: ",  req.params.id)
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
DashboardController.get('/revdashboard/:id', (req, res) => {
    console.log("reached endpoint with id: ",  req.params.id)
    const username = req.params.id || null;

    if (username) {
        const revDashBuilder = new RevDashboardBuilder(dao, username);
        revDashBuilder.buildDashboard().then(reviewerOses => {
            res.json(reviewerOses);
        }).catch(err => {
            res.json(err);
        });

    } else {
        res.json(new Error(`user ${username} has no dash data, user not found.`))
    }
})
//
DashboardController.get('/admindashboard/:id', (req, res) => {
    console.log("reached endpoint with id: ",  req.params.id)
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
