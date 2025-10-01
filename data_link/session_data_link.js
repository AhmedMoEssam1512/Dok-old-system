const sequelize = require('../config/database');
const Session = require('../models/session_model');
const {where} = require("sequelize");
const {verify} = require("jsonwebtoken");
const Admin = require('../models/admin_model');
const { Op, fn, col } = require("sequelize")

function findSessionById(sessionId){
    return Session.findOne({where : { sessionId } });
}

function UpdateSession(sessionId, dateAndTime){
    return Session.update({dateAndTime},{where : { sessionId } })};

// async function findAllUpcomingSessionByGroup(group) {
//     return await Session.findAll({
//         include: [{
//             model: Admin,
//             where: { group },  // filter by admin's group
//             attributes: []     // don't return admin fields unless needed
//         }],
//         where: {
//             dateAndTime: {
//                 [Op.gt]: fn('NOW') // uses PostgreSQL current timestamp, avoids timezone mismatch
//             }
//         },
//         order: [['dateAndTime', 'ASC']]
//     });
// }

function getActiveSessionByGroup(group) {
    return Session.findOne({
        where: {
            group,
            finished: false
        },
        order: [['dateAndTime', 'DESC']]
    });
}

module.exports={
    findSessionById,
    UpdateSession,
//    findAllUpcomingSessionByGroup,
    getActiveSessionByGroup
}