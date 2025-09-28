const sequelize = require('../config/database');
const Student = require('../models/student_model');
const Admin = require('../models/admin_model');
const {where} = require("sequelize");
const Rejection = require('../models/rejection_model.js');
const Registration = require('../models/registration_model.js');
const Attendance = require('../models/attendance_model.js');
const Submission = require('../models/submission_model.js');
const {verify} = require("jsonwebtoken");

function findStudentByEmail(studentEmail){
    return Student.findOne({where : { studentEmail } })
}

function registerStudent(studentEmail, group){
    return Registration.create({
        studentEmail,
        group});
}

function createStudent(studentName,studentEmail,password,parentEmail,birthDate,
                       studentPhoneNumber,parentPhoneNumber,group,semester)
{
    return Student.create({
        studentName,
        studentEmail,
        password,
        parentEmail,
        birthDate,
        studentPhoneNumber,
        parentPhoneNumber,
        group,
        semester
    });
};

function findStudentById(studentId){
    return Student.findOne({where : { studentId } })
}

function createAttendance(studentId, sessionId, semester) {
    return Attendance.create({
        studentId,
        recordedAt: new Date(),
        semester,
        sessionId
    });
}

function findAttendanceByStudentAndSession(studentId, sessionId) {
    return Attendance.findOne({ 
        where: { 
            studentId: studentId.toString(), 
            sessionId: sessionId.toString() 
        } 
    });
}

function getGroupById(studentId){
    return Student.findOne({where : { studentId } }).then(student=>{
        if(!student) return null;
        return student.group;
    })
}

function showSubmissions(studentId){
    return Submission.findAll({where:{studentId}})
}

function getTotalNumberOfStudents(){
    return Student.count({where: { verified: true }});
}

function showLeaderBoard(limit,offset){
    return Student.findAndCountAll({
    attributes: ["studentName", "totalScore", "studentId"],
    where: { verified: true },
    order: [["totalScore", "DESC"]],
    limit,
    offset
    });
}

function getStudentScore(id){
    return Student.findOne({
        attributes: ["totalScore"],
        where: { studentId: id }   
    });
}


async function getStudentRank(id) {
  try {
    const [result] = await sequelize.query(
      `
      SELECT rank FROM (
        SELECT "studentId",
               RANK() OVER (ORDER BY "totalScore" DESC) AS rank
        FROM student
        WHERE verified = true
      ) ranked
      WHERE "studentId" = :id
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return result ? result.rank : null;
  } catch (err) {
    console.error("Error in getStudentRank:", err.message);
    throw err;
  }
}


module.exports={
    findStudentByEmail,
    createStudent,
    registerStudent,
    findStudentById,
    createAttendance,
    findAttendanceByStudentAndSession,
    getGroupById,
    showSubmissions,
    getTotalNumberOfStudents,
    showLeaderBoard,
    getStudentScore,
    getStudentRank
}