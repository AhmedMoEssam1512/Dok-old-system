const sequelize = require('../config/database');
const Session = require('../models/session_model');
const {where} = require("sequelize");
const {verify} = require("jsonwebtoken");
const Admin = require('../models/admin_model');
const { Op, fn, col } = require("sequelize")
const Attendance = require('../models/attendance_model');
const Topic = require('../models/topic_model');
Session.belongsTo(Topic, { foreignKey: 'topicId' });
Session.hasMany(Attendance, { foreignKey: 'sessionId' });
Attendance.belongsTo(Session, { foreignKey: 'sessionId' });


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

function hasAttendedSession(studentId, sessionId) {
    return Attendance.findOne({
        where: {
            studentId,
            sessionId
        }
    });
}

function recordAttendance(studentId, sessionId) {
    return Attendance.create({
        studentId,
        sessionId,
        recordedAt: new Date()
    });
}

async function getAllAttendanceForASession(sessionId){
    return await Attendance.findAll({
        where: { sessionId },
        attributes : {include : [['attId','id']]},
        order: [['recordedAt', 'ASC']]
    });
}

async function findAllSessionsByAdminGroup(group) {
  return await Session.findAll({
    where: { group },
    order: [['dateAndTime', 'DESC']],
    include: [
      {
        model: Topic,
        attributes: ['topicName', 'subject'], // only select what you need
        required: true // ensures only sessions with a valid topic are returned
      }
    ]
  });
}


async function findAllSessionsByStudentGroup(group, studentId) {
  return await Session.findAll({
    where: { group },
    order: [['dateAndTime', 'DESC']],
    include: [
      {
        model: Topic,
        attributes: ['topicName', 'subject'],
        required: true
      },
      {
        model: Attendance,
        attributes: [], // We don't need to select any columns from Attendance
        where: { studentId: studentId },
        required: false // ← LEFT JOIN (important!)
      }
    ],
    attributes: {
      include: [
        [
          sequelize.fn(
            'CASE',
            sequelize.when(
              sequelize.col('Attendances.attId'),
              true
            ),
            false
          ),
          'attended' // ← This becomes session.attended
        ]
      ]
    }
  });
}

module.exports={
    findSessionById,
    UpdateSession,
//    findAllUpcomingSessionByGroup,
    getActiveSessionByGroup,
    hasAttendedSession,
    recordAttendance,
    getAllAttendanceForASession,
    findAllSessionsByAdminGroup,
    findAllSessionsByStudentGroup
}