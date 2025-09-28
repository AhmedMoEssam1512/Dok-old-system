const sequelize = require('../config/database');
const { Op } = require("sequelize");
const Quiz = require('../models/quiz_model');
const Admin = require('../models/admin_model');
const Submission = require('../models/submission_model');

Quiz.belongsTo(Admin, { foreignKey: "publisher" });


function createQuiz(mark,publisher,quizPdf,date,semester,durationInMin,topicId, title){
    return Quiz.create({mark,publisher,quizPdf,date,semester,durationInMin, topicId, title, createdAt: Date.now()});
};

function getAllQuizzes(){
    return Quiz.findAll();
};

async function getAllQuizzesForGroup(group) {
  return await Quiz.findAll({
    include: [
      {
        model: Admin,
        attributes: ["group"],
        where: {
          [Op.or]: [
            { group: group },
            { group: "all" }
          ]
        }
      }
    ]
  });
}

function getQuizById(quizId) {
    return Quiz.findByPk(quizId);
}

function updateQuizDates(quizId, newDate) {
    return Quiz.update({ date: newDate }, { where: { quizId } });
}

function createSubmission(quizId, studentId,assistantId ,answers, semester) {
    return Submission.create({ quizId, studentId,assistantId ,answers, semester, type : "quiz" });
}

function findSubmissionByQuizAndStudent(quizId,studentId){
    return Submission.findOne({where :{quizId,studentId,type:"quiz"}})
}

async function getQuizzesByTopicId(topicId) {
    return await Quiz.findAll({
    where: { topicId },
    attributes: ['id', 'name'], // only return id and name
  });
}


module.exports = {
     createQuiz,
    getAllQuizzes,
    getAllQuizzesForGroup,
    getQuizById,
    updateQuizDates,
    createSubmission,
    findSubmissionByQuizAndStudent,
    getQuizzesByTopicId
};