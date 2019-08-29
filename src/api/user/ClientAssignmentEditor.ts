
import {WKODbAccess} from "../../data/WKODbAccess";
import {IOsClients} from "../../data/Repository";
export default class ClientAssignmentEditor {
    private dao: WKODbAccess
    constructor(dao: WKODbAccess) {
        this.dao = dao;
    }
    public verifyFamilies(familyIDs: any) {
        const verification: any = {
            valid:  [],
            invalid: []
        }
        const familyPromises = familyIDs.map((id: any) => {
            return this.dao.families().find(id).then(doc => {
                verification.valid.push(id);
                return;
            }).catch((err: any) => {
                verification.invalid.push(id);
                return;
            })
        });

        return Promise.all(familyPromises).then(promiseReses => {
            return verification;
        }).catch(err => {
            return err
        })
    }

    public assignFamilies(families: any, userDBName: string) {
        // this.dao.families().find(req.body.familyID).then(family => {
                return this.dao.osClients(userDBName).find('clients').then(clients => {
                    families.forEach((id: any) => {

                        if (clients.clients.map(fam => {return fam.familyID}).indexOf(id) < 0) {
                            clients.clients.push({familyID: id})
                        }
                    })
                    return this.dao.osClients(userDBName).update(clients).then(updateResult => {
                        return {success: true, clients};
                    }).catch(err => {
                        return {err: err.error, clients};
                    })
                }).catch(err => {
                    let newClients: IOsClients = {_id: 'clients', clients: []}
                    if(err.error === "not_found") {
                        newClients.clients = families.map((id:any) => {return {familyID: id}})
                       return this.dao.osClients(userDBName).create(newClients).then(createResult => {
                            return {success: true, newClients}
                        }).catch(err => {
                            return {err: "Tried to create new clients doc and failed", newClients};
                        })
                    }
                    return {err: "Error assigning family to user", newClients};
                })
            // }).catch(err => {
            //     if (err.error === 'not_found') {
            //         res.status(400).json({err: "Family does not exist.", familyID: req.body.familyID})
            //     }
            //     res.status(400).json({err: "Could not verify that family exists", familyID: req.body.familyID})
            // })
    }

    public deassignFamilies(families: any, userDBName: string)  {
        return this.dao.osClients(userDBName).find('clients').then(clients => {
            families.forEach((id: any) => {
                if (clients.clients.map(fam => {return fam.familyID}).indexOf(id) >= 0) {
                  
                    clients.clients.splice(clients.clients.map(fam => {return fam.familyID}).indexOf(id),1)
                }
            })
            return this.dao.osClients(userDBName).update(clients).then(updateResult => {
                return {success: true, clients};
            }).catch(err => {
                return {err: err.error, clients};
            })
        }).catch(err => {
            let newClients: IOsClients = {_id: 'clients', clients: []}
            if(err.error === "not_found") {
                return this.dao.osClients(userDBName).create(newClients).then(createResult => {
                    return {success: true, newClients}
                }).catch(err => {
                    return {err: "Tried to create new clients doc and failed", newClients};
                })
            }
            return {err: "Error deassigning family to user", newClients};
        })
    }
}
