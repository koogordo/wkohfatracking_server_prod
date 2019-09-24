import express, {Request, Response} from 'express'
import { WKODbAccess} from "../../data/WKODbAccess";
import {DbConfig} from "../../config"
import {IWKORequest} from "../../server/WKOCommunication";
import OsDashboardBuilder from "../dashboard/utils/OsDashboardBuilder";
import RevDashboardBuilder from "../dashboard/utils/RevDashboardBuilder";
import AdminDashboardBuilder from "../dashboard/utils/AdminDashboardBuilder";
import {checkJwt, checkRole} from "../authentication/middleware/JwtMiddleware";
import OsViewVisitBuilder from "./utils/OsViewVisitBuilder";
import FormUtil from "../../utils/FormUtil";
const VisitController = express.Router();
const dao = new WKODbAccess(DbConfig);
VisitController.post("/viewvisit", [checkJwt], (req: Request, res: Response) => {
    if (!req.body.id) {
        res.status(400).json({err: `Missing request params "id"`, body: req.body})
    }
    if (!req.body.userDBName) {
        res.status(400).json({err: `Missing request body value "userDBName"`, body: req.body})
    }
    if (!req.body.clientID) {
        res.status(400).json({err: `Missing request body value "clientID"`, body: req.body})
    }

    const osViewVisitBuilder = new OsViewVisitBuilder(dao, req.body.userDBName, req.body.id, req.body.clientID);
    osViewVisitBuilder.makeDisplayVisit().then((visit) => {

        res.status(200).json(visit)
    }).catch(err => {
       
        res.status(400).json({err});
    })
})

VisitController.post("/prevvisits", [checkJwt],(req: Request, res: Response) => {

    if (!req.body.id) {
        res.status(400).json({err: `Missing request params "id"`, body: req.body})
    }
    if (!req.body.userDBName) {
        res.status(400).json({err: `Missing request body value "userDBName"`, body: req.body})
    }
    if (!req.body.clientID) {
        res.status(400).json({err: `Missing request body value "clientID"`, body: req.body})
    }

    const osViewVisitBuilder = new OsViewVisitBuilder(dao, req.body.userDBName, req.body.id, req.body.clientID);
    osViewVisitBuilder.getPreviousVisits().then(prevVisits => {
        res.status(200).json(prevVisits)
    }).catch(err => {
        res.status(400).json({
            ok: false,
            err
        })
    })
})
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
